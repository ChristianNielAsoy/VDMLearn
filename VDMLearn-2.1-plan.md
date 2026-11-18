# VDMLearn 2.1 Plan

Premise (owner-reported): everything in docs/VDMLearn-2.0-plan.md is built. This was not verified by the plan's author: V0 checks it.
2.1 goal: make the app **trustworthy, evidence-aligned, filled with content, and actually used**. No new feature families until the trial (V5) ends.
Inputs: docs/2.1-evidence-notes.md, docs/audit-checklist.md, VDMLearn.md, CLAUDE.md, curriculum + TOS JSON files.

## Order and dependencies

V0 Verify > V1 Trust > V2 Evidence alignment > V3 Pre-DVM taxonomy > V4 Content engine > V5 Deploy + 2-week trial > V6 Friends > V7 Maintainability > V8 Backlog (decided from trial data).
V5 may start after V1 + V2; V3/V4 can run alongside the trial.

## Definition of done (every milestone)

lint, typecheck, tests, build pass; new logic unit-tested; migrations tested from the previous version with sample data; backup/restore still works; keyboard-only and 360/768/1280px checks on touched screens; no secrets, no paid services, no new dependency without owner approval; VDMLearn.md, CLAUDE.md and docs/audit-checklist.md updated.

## V0. Verify (read-only, S)

Gap analysis of every 2.0 item (Done / Partial / Missing / Changed, with evidence), the evidence adjustments, risk checks, tools output, re-run audit.
Acceptance: docs/audit-YYYY-MM-DD-post-2.0.md exists; VDMLearn.md matches the code; gaps listed with severity.

## V1. Trust and correctness (M)

- **Formulas:** every calculator and reference card lists formula, units, source, and a unit test with a worked textbook example. No source = `verified:false` with a visible "unverified" badge. Study-only disclaimer on all dosing/fluid/feed content.
- **FSRS:** feature flag, revert path, reference-vector tests, SM-2 conversion test.
- **Data safety:** migration tests from the previous schema with sample data; import tests for backup v1 and v2; documented restore test on a second device.
- **Security:** every v-html sanitized; Mermaid strict; npm audit clean or documented.
- **Mock exam:** shows shortfall when the bank is too small (never silently repeats); duration, pass rule, exam date are settings labeled "unverified".
- **No unvalidated claims:** remove or relabel any predicted pass probability; show coverage and accuracy only.
  Acceptance: zero Critical/High in the audit; every formula has a source or a visible unverified badge.

## V2. Evidence alignment (M)

Source: docs/2.1-evidence-notes.md.

- Confidence tap BEFORE feedback (setting to skip, default on).
- High-confidence wrong answer: re-queue at end of the session and schedule a retest next day.
- Mistake journal: one optional tap (knowledge gap / misread / careless / mixed up); "Missed items" review re-asks items instead of making the user read sheets.
- Optional "explain why" self-explanation box after answers (ungraded, saved to notes).
- Interleaving: due reviews mixed by default; "force mixed" setting for new material.
- Label-the-diagram quiz is the primary visual activity; no 3D/VR.
- Local usage log: feature opened, session length, items done, accuracy; exportable; no external analytics.
  Acceptance: tests for confidence ordering, retest scheduling, and settings; usage log export works.

## V3. Pre-DVM taxonomy (M)

Why: the owner's study material today is Year 0 (chemistry, organic chemistry, biochemistry, biology/zoology, statistics, genetics), which the PRC TOS does not cover.

- Taxonomy for Year 0 courses with ids such as `PRE:CHEM-GEN:...`, built from the curriculum JSONs (UPLB CHEM 18/40/160, STAT 164; PSAU BP-GIC, BP-PB 1/2, GE-Zoo 1, Chem 1/2, Biostat, Mol Bio 1; CLSU courses). Topic lists are derived from course names + standard table-of-contents-level topics, each with `source`; owner approves before use.
- Support `competencyId` for non-PRC topics; "By my course" and coverage views work for Year 0; prerequisite tree uses the curriculum prerequisites.
- Link out to OpenStax and Khan Academy per topic (verify terms); do not copy text.
  Acceptance: taxonomy JSON validated by tests; coverage view lists Year 0 topics with zero questions; no invented syllabus.

## V4. Content engine (M, then ongoing)

- Question-generation prompt template (docs/generate-questions-prompt.md v2) that requires a competency id, a source, Bloom level, and one best answer.
- Import lint rules: valid answer key, distinct choices, no "all of the above", explanation and source present, stem length limits, duplicate-stem detection.
- Solo verification: second-pass check against the source at least 24 hours after creation; status moves to `verified` only with a recorded source.
- Coverage dashboard drives what to write next (largest gaps by exam weight / Year 0 topic).
- Targets: Year 0 pilot 100 verified questions across 5 subjects; VMLE pilot 20 per subject (180). Scale after the trial.
  Acceptance: import rejects bad questions with clear messages; coverage updates after import; pilot counts tracked.

## V5. Deploy and two-week trial (S/M)

- Free host (verify current free limits and idle rules first), HTTPS, PWA install on phone and laptop, update strategy for the service worker, CSP headers, README with deploy steps, no secrets in repo.
- Weekly backup reminder (export).
- Trial: 14 days, daily use. Track: days used, sessions, items answered, due-queue cleared, features used, bugs, confusing screens.
- End-of-trial review: keep / fix / cut list; decide V8 backlog from data.
  Acceptance: installed and used on two devices; backup restored successfully once; trial report in docs/trial-YYYY-MM.md.

## V6. Friends (only after V5 and if accounts exist) (M)

- Privacy: collect minimum data, consent notice, export and delete account; check RA 10173 obligations before inviting anyone.
- Row-level security tested with two accounts; 2-approval verification tested (no self-approval, source required); rate limits and free-tier limits checked.
- Invite-only; start with 1-2 friends for two weeks; moderation rules written.
  Acceptance: automated RLS tests pass; a friend can import a content pack, answer, flag and verify end to end.

## V7. Maintainability (S)

README, CI (lint, typecheck, tests, build), dependency update policy, license check, coverage threshold on pure logic, issue template.

## V8. Backlog (decide after trial)

Candidates: more visuals, Anki import/export refinements, more calculators (with sources), skills checklists, virtual patient cases (supplement), CLSU Years 4-6 and PSAU details, UI refinements from trial pain points. Cut anything unused.

## Owner tasks (non-code)

- Verify at prc.gov.ph: pass rule, exam duration per subject, next dates.
- Ask PSAU: does the bridging program apply to a college graduate? Ask each school about degree-holder admission and credit transfer.
- Get CLSU Years 4-6 and the current official curriculum of the chosen school.
- Decide the free host after checking current limits.

## Risks

| Risk                        | Mitigation                                           |
| --------------------------- | ---------------------------------------------------- |
| "Done" in 2.0 is overstated | V0 verification before anything else                 |
| Wrong formulas or facts     | Source + test + verified badge                       |
| Content never gets written  | Coverage dashboard, small pilot targets, import lint |
| Over-building before use    | Trial gate (V5) decides V8                           |
| Data loss                   | Backup reminders, tested restore                     |
| Over-claiming readiness     | Descriptive only                                     |

---

# Claude Code prompts (use one per session; always plan first)

## Shared header (put at the top of every prompt)

```
Read CLAUDE.md, VDMLearn.md, docs/VDMLearn-2.1-plan.md and docs/2.1-evidence-notes.md. Do ONLY the milestone named below. First write a short plan (files, tests, risks) and WAIT for my OK. Small commits, one per numbered item; lint, typecheck, tests and build pass after each. Migrations non-destructive and tested. No new dependency without asking. Never invent sources, syllabus items or exam facts: if something is missing, mark it unverified and ask me. At the end update VDMLearn.md and docs/audit-checklist.md and summarize changes, decisions and risks.
```

## V0

```
MILESTONE V0 (read-only; do not change code). For every item in M0-M9 of docs/VDMLearn-2.0-plan.md give Done/Partial/Missing/Changed with evidence (path, test name, command output) or "unverified". Do the same for the 8 plan adjustments in docs/2.1-evidence-notes.md. Run lint, typecheck, tests, build, npm audit and report real output. Re-run docs/audit-checklist.md and save docs/audit-YYYY-MM-DD-post-2.0.md. Update VDMLearn.md to match the code. Summarize the top 10 findings and wait.
```

## V1

```
MILESTONE V1 (Trust and correctness). Items: (1) inventory every calculator/reference card/formula with formula, units, source, test; missing source => verified:false + visible badge, never invent a source; add study-only disclaimer; (2) FSRS flag, revert path, reference-vector tests, SM-2 conversion test; (3) migration tests from previous schema with sample data, backup v1/v2 import tests, written restore test steps; (4) sanitize every v-html, Mermaid strict, tests with malicious payloads, npm audit; (5) mock exam shows shortfall instead of silently repeating, exam duration/pass rule/date as settings labeled unverified; (6) remove or relabel any predicted pass probability.
```

## V2

```
MILESTONE V2 (Evidence alignment). Items: (1) confidence tap before feedback, setting to skip, default on; (2) high-confidence wrong => re-queue at session end and retest next day; (3) mistake journal: one optional tap with 4 reasons; "Missed items" review re-asks items; (4) optional "explain why" box saved to notes; (5) due reviews mixed by default, "force mixed" setting for new material; (6) label-the-diagram is the primary visual activity; (7) local usage log (feature opened, session length, items, accuracy) with JSON export, no external analytics. Tests for ordering, scheduling and settings.
```

## V3

```
MILESTONE V3 (Pre-DVM taxonomy). First propose the id scheme and JSON schema, then WAIT. Build Year 0 topics from the curriculum JSONs (course names, prerequisites) plus standard table-of-contents-level topics, each with a source field; I approve the list before use. Support non-PRC competency ids everywhere competencyId is used. Make "By my course", coverage view and the prerequisite tree work for Year 0. Add link-outs to OpenStax/Khan topic pages (no copied text). Validate the taxonomy with tests.
```

## V4

```
MILESTONE V4 (Content engine). Items: (1) rewrite docs/generate-questions-prompt.md requiring competency id, source, Bloom level, one best answer, 4 distinct choices; (2) import lint rules: valid key, distinct choices, no "all of the above", explanation and source present, stem length limits, duplicate-stem detection, clear per-item errors; (3) solo verification: second-pass check at least 24h after creation, verified only with a recorded source; (4) coverage dashboard sorted by largest gaps (exam weight for VMLE, topic count for Year 0); (5) progress counters toward the pilot targets. Tests for lint rules and status transitions.
```

## V5

```
MILESTONE V5 (Deploy). Ask me which free host I prefer; verify its current free limits and idle rules from its docs before configuring. Items: production build config, HTTPS, PWA install check, service worker update strategy, CSP headers, README deploy steps, no secrets in repo, weekly backup reminder, in-app link to export usage log. Write docs/trial-template.md with the metrics to record for the 14-day trial.
```

## V6

```
MILESTONE V6 (Friends). Only proceed if accounts exist. Items: data minimization review, consent notice, account export and delete, automated row-level-security tests with two accounts, 2-approval verification tests (no self-approval, source required), rate limits and free-tier limit checks, invite-only flow, written moderation rules. List any RA 10173 obligations you cannot verify and ask me to check them.
```
