# Audit Checklist — DVM Reviewer

Run before each phase gate.

## Automated

```bash
npm run lint        # must exit 0, 0 errors
npm run typecheck   # must exit 0
npm test            # all tests must pass
npm run build       # must exit 0 (requires Node ≥ 22.22.0)
npm audit           # 0 high or critical vulnerabilities
```

## Manual — Core flows

- [ ] Open app in browser; all tabs load without console errors (Browse, Lessons, Mock, Quiz, Plan, Progress, Settings)
- [ ] Import a sample question JSON → question appears in Browse under correct subject
- [ ] Answer 5 quiz questions → Progress page updates accuracy percentages
- [ ] Open a lesson with a Mermaid diagram → diagram renders (no raw Mermaid text visible)
- [ ] Flip flashcards for a lesson → complete the full deck, then use "Retry Unknown"
- [ ] Add a planner task (due today) → appears in "Today" group; mark done → moves to Done
- [ ] Export backup → `.json` file downloads
- [ ] Clear all data → confirm dialog; data gone; reimport the backup → counts shown in status banner
- [ ] Toggle dark mode in Settings → page switches; reload → dark mode persists

## Manual — Responsive layout

- [ ] Resize to 360px width → no horizontal overflow, all tab labels readable, touch targets ≥ 44px
- [ ] At 768px → layout correct
- [ ] At 1280px → layout correct

## Manual — Accessibility

- [ ] Tab through quiz choices with keyboard → all 4 choices reachable, Enter submits
- [ ] Screen reader announces each choice with its letter and text connected

## Security

- [ ] Import a backup where `lessonNotes.bodyMd` contains `<img src=x onerror="alert(1)">` → alert must NOT fire (DOMPurify required for this to pass)
- [ ] Import a JSON question file with `"status": "verified"` → question must appear as `unverified` in the UI

## Data integrity

- [ ] After 20+ quiz attempts, SRS due queue shows expected questions (those answered wrong should appear sooner)
- [ ] Backup JSON exported immediately after import contains all imported questions

## M1 Foundation (manual verification)

- [ ] Answer a question → DevTools IndexedDB shows a `reviewEvents` row with `objectId`, `sessionId`, `activityType: "mcq"`, `rating` 1–4
- [ ] Start two quiz sessions → both have different `sessionId` UUIDs in `reviewEvents`
- [ ] Set `localStorage.dvmr-scheduler = 'fsrs'`, answer questions → SRS still works; `progress` rows have `algorithm: "fsrs"` and `fsrsStability > 0`
- [ ] Remove `dvmr-scheduler` from localStorage → SM-2 resumes; no data loss
- [ ] Export backup → `version: 2`, `flags`, `reviewEvents`, `contentPacks` keys present in JSON
- [ ] Import a v1 backup file (no `flags`/`reviewEvents`/`contentPacks` keys) → accepted without error, summary shown
- [ ] Dexie upgrade test: open DevTools IndexedDB on a v6 database (pre-M1), reload app → version jumps to v8; `importedQuestions` rows have `competencyIds` array populated
