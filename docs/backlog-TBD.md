# Backlog — Decisions Deferred

Items below are explicitly deferred until after the trial period (first real import + review cycle).
They are not forgotten — they are intentionally not planned yet.

---

## V5 — Deploy (skipped for now)

- Hosting target: Cloudflare Pages or Vercel (free tier)
- PWA manifest and service worker smoke test
- Confirm free-tier limits and pausing rules before launch
- Decision: revisit once the question bank has ≥ 50 verified questions

## V6 — Friends (skipped for now)

- Supabase auth + shared bank
- Two-approver verification flow
- RLS policies
- Decision: add only when a second user is ready to contribute

## Other deferred items

| Item | Reason deferred |
| ---- | --------------- |
| Capacitor Android build | Needs stable SPA first |
| Mock board exam (Phase 5) | Needs ≥ 100 questions per subject |
| Confidence tap (M2 quiz UX) | Waiting for M1 foundation |
| FSRS scheduler | Waiting on `ts-fsrs` approval (M1 C4) |
| Content packs (M1 C5) | Waiting on M1 foundation |
| School tracker (Phase 9) | Low priority until enrolled |
| Admission tracker | Verify deadlines with registrars first |

---

Review this file at the start of each new milestone to see if anything is ready to unblock.
