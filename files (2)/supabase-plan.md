# Supabase plan: dynamic online content for VDMLearn

Status: design + database migrations tested on a local Postgres with stubbed Supabase pieces (see "What was tested"). NOT yet run on a real Supabase project.

## Short answer

Yes. Keep Git as the master copy of authored content (content/ folder), publish it into Supabase (Postgres + Storage + Auth), and let the app read it online and cache it locally (Dexie) so it still works offline.

## Architecture

```
content/ (Git, master)  --publish script (service role, run on your machine)-->  Supabase
                                                                                 ├─ Postgres: competencies, sources, questions, lessons, diagrams, media
                                                                                 ├─ Postgres: approvals, flags, attempts, notes  (user data, RLS)
                                                                                 ├─ Storage: diagrams bucket
                                                                                 └─ Auth: email login
App (supabase-js, anon key + RLS)  <--read/write-->  Supabase   and   Dexie cache (offline-first)
```

Rules:

- The service-role key lives only on your machine for the publish script; never in the app, the repo, or CI logs.
- The anon key is safe in the app only because Row Level Security is on for every table.
- Reference data (PRC topics, curricula) stays as versioned JSON in the app; the `competencies` table is loaded from it so coverage queries work in SQL.
- Content versioning: `version` and `updated_at` columns; the app pulls rows newer than its last sync.

## Free plan facts (checked 2026-11-18; recheck at supabase.com/pricing)

2 active projects; 500 MB database; 1 GB file storage; 5 GB egress; 50,000 monthly active users; projects pause after 1 week of inactivity; automatic backups are not included on the free plan.
Implications:

- Text content is tiny. Rough estimate (assumption): 900 questions at about 1.5 KB each is about 1.4 MB, far below 500 MB.
- A paused project stops answering. The app must work from its local cache; manual reactivation is needed in the dashboard.
- No automatic backups: Git holds the content; export user data (attempts, notes) from the app regularly.
- Keep large images out; SVG diagrams are small.

## Tables (migrations in supabase/migrations/)

| Table                        | Purpose                                                                 |
| ---------------------------- | ----------------------------------------------------------------------- |
| profiles                     | role: owner / verifier / member (first account becomes owner)           |
| sources                      | license, aiIngestion, shareable                                         |
| competencies                 | PRC ids and PRE ids, items, exam weight                                 |
| questions                    | content, status, content_hash, version, source and source_id (required) |
| lessons, lesson_competencies | lessons and their competency links                                      |
| media, diagrams              | registered images; hotspot JSON                                         |
| question_approvals           | one row per approver; tied to the exact content hash                    |
| flags                        | user reports                                                            |
| attempts                     | append-only answer log with confidence, rating, response time           |
| user_notes                   | private notes, optionally shared                                        |
| coverage (view)              | verified vs total questions per competency, respecting RLS              |

Built-in rules:

- A question becomes `verified` only with 2 distinct approvers, none the author, each citing a source, each reviewing the current text (hash). Editing the text resets it to `unverified`.
- Members can only insert their own `unverified` questions.
- Questions and lessons from sources with `shareable = false` are visible only to the owner (and their author).
- Attempts are private per user; notes are private unless shared.

## What was tested (supabase/tests/db_behavior_test.py)

23 checks on a real local Postgres, with stand-ins for Supabase's `auth` schema, `auth.uid()`, `authenticated` role and storage tables: first user becomes owner; author cannot self-approve; stale or blank reviews rejected; double approval rejected; 2 approvals verify; editing resets verification and bumps version; approvals recompute on delete; members cannot see non-shareable questions or insert as verified or write sources; attempts are private; coverage view works. NOT tested: real Supabase Auth, Storage policies, the JS client, performance.

## Rollout

| Step | What                                                                                                   | Gate                                                                     |
| ---- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| S0   | Solo, local only (today)                                                                               | none                                                                     |
| S1   | Create the project; apply migrations; publish pack-001 as the owner; app reads online, caches in Dexie | migrations pass on the real project; RLS tests pass with 2 test accounts |
| S2   | Sync attempts and notes (append-only upload; pull on new device)                                       | export/restore tested                                                    |
| S3   | Invite 1-2 friends as members; approvals live                                                          | privacy review (RA 10173), RLS tests                                     |
| S4   | Storage bucket for diagrams; image licensing checks                                                    | licenses recorded in media                                               |

## Decisions needed

1. Login method (email magic link or password).
2. Whether any content may be readable without login (default: no).
3. Whether friends see only shareable-source content (default: yes, enforced by RLS).
4. Who is a verifier (default: anyone, 2 approvals).

## Risks

| Risk                                | Mitigation                                                                                                            |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Free project pauses                 | Local cache; reactivate manually; consider a periodic request                                                         |
| No automatic backups                | Git master + user data export                                                                                         |
| RLS mistake exposes private content | Policy tests with 2 accounts before inviting anyone; sources.shareable enforced in policy                             |
| Service key leaks                   | Local-only script; never in repo or client; rotate if exposed                                                         |
| Content drift between Git and DB    | Publish script is the only writer for authored content; DB edits by members are limited to their own unverified items |
| Privacy                             | Store minimum data; consent notice; account export and delete (check RA 10173 duties before inviting anyone)          |

## Claude Code prompt (S1 only)

```
Read CLAUDE.md, content/README.md, docs/supabase-plan.md and supabase/migrations/*.sql. Task: Supabase step S1. Plan first and WAIT for my OK. No new dependency without asking (supabase-js is allowed).
1. Review the 3 migrations against my plan; list any problems before running anything.
2. Write scripts/publish-content: validate content/ against content/_schema, check every competency id and sourceId exists, check manifest checksums, then (dry-run by default, --apply to write) upsert sources, competencies, questions, lessons, media and diagrams using the service-role key from an environment variable. Never publish items from sources with shareable=false unless --include-private is passed. Never write status "verified".
3. Add a read-only repository in the app that loads content from Supabase when online and falls back to the Dexie cache; keep the existing local repository working with no login.
4. Add RLS tests that sign in two test accounts and prove: members cannot read non-shareable items, cannot set verified, cannot read others' attempts.
5. Document setup steps (project creation, running migrations, env variables) in docs/supabase-setup.md. Do not commit any keys.
Small commits; lint, typecheck, tests and build pass; update VDMLearn.md.
```
