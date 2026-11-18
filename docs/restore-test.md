# Restore / Migration Test Procedure

Manual checklist to run before and after any Dexie schema upgrade.

## Unit test coverage

`src/__tests__/migration.test.ts` — pure-function mirror of the v8 `.upgrade()` callback.
Run with `npx vitest run src/__tests__/migration.test.ts`.

## Full manual restore test

Use when bumping the Dexie version or touching the upgrade callbacks.

### 1 — Seed a pre-upgrade database in the browser

1. Open DevTools → Application → IndexedDB → delete `dvmr-db` if present.
2. Temporarily pin `dexie.ts` to the **previous** version number (e.g., v7 to test the v8 upgrade).
3. Open the app and import at least 5 questions via `/import`.
   - Verify rows in `importedQuestions` have `competencyId` set but **no** `competencyIds`.
4. Confirm the data looks correct in DevTools.
5. Revert `dexie.ts` to the current version.

### 2 — Trigger the upgrade

1. Hard-reload the page (Ctrl+Shift+R).
2. In DevTools, check that `dvmr-db` is now at the new version.
3. Inspect `importedQuestions` rows — every row must now have:
   - `competencyIds: [competencyId]` (synthesised from the old `competencyId`)
   - `updatedAt: 0`
   - `version: 1`

### 3 — Backup round-trip

1. Go to Settings → Export backup.
2. Confirm the downloaded JSON has `"version": 2` and `"reviewEvents"` and `"flags"` keys.
3. Clear the database (Settings → Clear all data).
4. Import the backup file.
5. Verify imported questions and progress are restored.

### 4 — V1 file acceptance

1. Locate or create a v1 backup file (omit `reviewEvents`, `flags`, `contentPacks`).
2. Import it via Settings → Import backup.
3. Confirm no error is shown and existing data is preserved.

## Expected results

| Step | Pass criterion |
|---|---|
| v8 upgrade | All `importedQuestions` rows have `competencyIds`, `updatedAt`, `version` |
| Backup export | JSON contains `version:2`, `reviewEvents[]`, `flags[]`, `contentPacks[]` |
| Backup import (v2) | Questions and progress appear in app after import |
| Backup import (v1) | Accepted without error; missing tables default to `[]` |
