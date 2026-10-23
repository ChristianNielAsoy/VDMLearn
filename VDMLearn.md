# VDMLearn — System Overview

> Local-first study app for Philippine DVM students and VMLE (Veterinary Licensure Exam) board exam preparation. Built with Quasar/Vue 3. No paid APIs. Single-user for now; multi-user in a later phase.

---

## Quick Start

```bash
# Requires Node ≥ 22.22.0
npm install
quasar dev        # dev server at http://localhost:9000
npm test          # 108 unit/integration tests
npm run lint      # ESLint + vue-tsc
npm run build     # production SPA (dist/spa/)
```

---

## Tech Stack

| Layer        | Choice                  | Notes                                        |
| ------------ | ----------------------- | -------------------------------------------- |
| UI framework | Quasar 2 (Vue 3)        | Material Design, responsive, PWA-ready       |
| Language     | TypeScript (strict)     | `vue-tsc` for type checking                  |
| Routing      | unplugin-vue-router     | File-based; typed route params               |
| State        | Pinia v4 (setup stores) | One store per domain                         |
| Local DB     | Dexie v4 (IndexedDB)    | Versioned schema; v1–v8 migrations           |
| SRS          | SM-2 (default) / FSRS   | ts-fsrs library; flag: `localStorage dvmr-scheduler=fsrs` |
| Validation   | Zod                     | Validates imported question JSON             |
| Markdown     | marked                  | Renders lesson content and notes             |
| Diagrams     | Mermaid (lazy-loaded)   | Life-cycle and flowchart diagrams in lessons |
| Testing      | Vitest                  | Unit + data-integrity tests                  |
| Linting      | ESLint + Prettier       | `eslint.config.js` flat config               |

---

## Folder Structure

```
src/
├── __tests__/                 Unit and integration tests (108 total)
│   ├── srs.test.ts            SM-2 algorithm (10 tests)
│   ├── scoring.test.ts        isCorrect() helper (2 tests)
│   ├── importer.test.ts       Zod question validator (14 tests)
│   ├── validation.test.ts     TOS data integrity + question tags (10 tests)
│   ├── mockDraw.test.ts       Mock exam draw logic (11 tests)
│   ├── browse.test.ts         Browse-mode toggle composable (4 tests)
│   ├── competencyRepository.test.ts  CompetencyRepository (11 tests)  [M1.1]
│   ├── activityRegistry.test.ts      ActivityRegistry + MCQ/flashcard (12 tests) [M1.2]
│   ├── reviewEvent.test.ts    deriveRating rule (6 tests)  [M1.3]
│   ├── scheduler.test.ts      SM-2 Scheduler wrapper (7 tests)  [M1.4]
│   ├── fsrs.test.ts           FSRS Scheduler (ts-fsrs, 11 tests)  [M1.4]
│   ├── contentPack.test.ts    Content pack install/update/remove (8 tests)  [M1.5]
│   └── backup.test.ts         BackupFileV2 type guards + v1→v2 (5 tests)  [M1.6]
│
├── components/
│   └── MermaidDiagram.vue     Lazy-loaded Mermaid renderer
│
├── composables/
│   └── useBrowseMode.ts       "By exam topic" / "By my course" toggle
│
├── data/
│   ├── questions/
│   │   └── sample.json        20 seed MCQs (ai-draft, unverified)
│   ├── lessons/
│   │   └── sample.json        3 seed lessons (Osteology, Cardiac, Toxoplasma)
│   ├── loaders/
│   │   ├── questions.ts       Merges seed + Dexie imported questions
│   │   └── lessons.ts         Loads lessons from JSON
│   ├── vmle-tos-2024.json     PRC Board Res. 07 s.2024 Annex A (official TOS, 9 subjects)
│   ├── curriculum.cmo2018.json  CHED CMO No. 1 s.2018 (national minimum, 229 units)
│   ├── curriculum.uplb2018.json UPLB CVM 2018-2019 (221 units, all 6 years)
│   ├── curriculum.psau2018.json PSAU CVM (261 units, all years)
│   └── curriculum.clsu2024.partial.json  CLSU Years 1–3 only
│
├── db/
│   ├── dexie.ts               Dexie class + table declarations
│   └── repository.ts          QuestionRepository interface + localRepository impl
│
├── pages/
│   ├── index.vue              Root layout: header, footer tabs, dark mode init
│   └── index/
│       ├── (index).vue        Browse page (exam-topic / by-course toggle)
│       ├── quiz.vue           Active quiz session
│       ├── mock.vue           Mock board exam (day selector + timer)
│       ├── progress.vue       Per-subject accuracy, due queue, bookmarks, flagged
│       ├── import.vue         JSON question importer with validation feedback
│       ├── settings.vue       Dark mode, backup export/import/clear, about
│       ├── lessons.vue        Passthrough layout for lesson routes
│       ├── lessons/
│       │   ├── (index).vue    Lesson list grouped by VMLE subject
│       │   └── [id].vue       Lesson detail: content, key terms, diagrams, notes, practice
│       ├── flashcards.vue     Passthrough layout for flashcard routes
│       └── flashcards/
│           └── [lessonId].vue Flip-card session: known/unknown, retry unknown
│       └── planner.vue        Study plan (exam countdown, weekly goals) + task tracker
│
├── router/
│   └── index.ts               Router setup (history mode)
│
├── activities/                Activity system [M1.2]
│   ├── registry.ts            Singleton ActivityRegistry (Map-based)
│   ├── mcq.ts                 MCQ ActivityDefinition (grade + toEvent)
│   └── flashcard.ts           Flashcard ActivityDefinition (grade + toEvent)
│
├── repositories/
│   └── competency.ts          CompetencyRepository (wraps TOS + curriculum loaders) [M1.1]
│
├── services/
│   ├── srs.ts                 SM-2 algorithm (legacy; still used by sm2 scheduler wrapper)
│   ├── importer.ts            Zod schema + validateImport()
│   ├── mockDraw.ts            TOS-weighted question draw logic
│   ├── backup.ts              Export/import/clear all local data (v2 format)
│   ├── contentPack.ts         Content pack pure logic (install/update/remove) [M1.5]
│   └── scheduler/             Scheduler implementations [M1.4]
│       ├── index.ts           getActiveScheduler() — reads localStorage flag
│       ├── sm2.ts             SM-2 Scheduler (wraps srs.ts; fixes first-wrong dueAt)
│       └── fsrs.ts            FSRS Scheduler (ts-fsrs library)
│
├── stores/
│   ├── questionStore.ts       Loads + caches all questions (seed + imported)
│   ├── quizStore.ts           Active quiz queue, answer submission, SRS update
│   ├── progressStore.ts       Per-subject accuracy, due queue, bookmarks, flags
│   ├── lessonStore.ts         Lesson list + per-lesson read/reviewed status
│   ├── flashcardStore.ts      Flip-card deck state (known/unknown/done)
│   └── plannerStore.ts        Tasks (CRUD), planner settings, weekly stats
│
└── types/
    ├── question.ts            Question, Attempt, VmleSubject, VMLE_SUBJECTS[]
    ├── progress.ts            SrsProgress (+ optional FSRS fields)
    ├── curriculum.ts          TosData, TosSubject, TosSection, TosCompetency, …
    ├── lesson.ts              Lesson, LessonStatus, UserLessonStatus, LessonNote
    ├── task.ts                SchoolTask, PlannerSettings, TaskType, TaskStatus
    ├── learningObject.ts      LearningObject base interface, CourseRef, OriginInfo [M1.1]
    ├── activity.ts            GradeResult, ActivityDefinition<T>, ActivityRegistry [M1.2]
    ├── review.ts              ReviewEvent, RatingConfig, deriveRating() [M1.3]
    ├── scheduler.ts           SchedulerState, Scheduler, SM2Data, FSRSData [M1.4]
    └── contentPack.ts         ContentPackManifest, InstalledPack, Install/Update/RemoveResult [M1.5]

docs/
├── generate-questions-prompt.md   Prompt template for generating MCQs offline
├── audit-2026-10-22.md            Full audit report
├── audit-checklist.md             Re-runnable quality checklist
└── reference/
    └── vmle-topics.clsu-leap.json  Legacy 8-subject syllabus (pre-2024 reference only)
```

---

## Features

### Browse (Phase 1)

Two view modes switchable via a chip toggle:

- **By exam topic** — Questions grouped by VMLE subject → section → competency (from PRC TOS)
- **By my course** — Questions grouped by school → year → semester → course

### Quiz Engine (Phase 1)

- Instant feedback with correct-answer highlight and explanation
- Records every attempt to IndexedDB
- Runs SM-2 SRS update after each answer
- Supports multiple scopes: competency, course, due queue, bookmarked, flagged, mock
- Bookmark toggle (amber star) and flag toggle (red flag) in the question header / feedback card

### SRS / Spaced Repetition (Phase 3)

- SM-2 algorithm in `srs.ts`: ease 1.3–4.0, intervals 1 → 6 → n×ease days
- Due queue surfaced on Progress page and Browse "Due Today" filter
- Bookmark toggle saved to Dexie

### Progress Dashboard (Phase 3)

- Accuracy % per VMLE subject (attempts and correct from all-time attempts)
- Weak subjects highlighted (≥ 5 attempts, < 60%)
- Due-today count with "Study Now" shortcut
- Bookmarked questions list with "Quiz all" shortcut
- Flagged questions list with "Quiz all" shortcut; unflag inline

### Mock Board Exam (Phase 5)

- Day selector (Day 1/2/3 matching PRC exam schedule)
- TOS-weighted draw: questions drawn per competency up to Annex A `items` limit
- 2-hour countdown timer per block
- Post-exam score and wrong-answer review

### JSON Importer (Phase 6)

- Paste or upload a JSON file (single question object or array)
- Zod validates every field; forces `status: 'unverified'`
- Reports per-item errors with field path and message
- Detects duplicate IDs within the batch

### Lessons + Notes (Phase 7)

- 3 sample lessons (more via JSON)
- Sections: Overview, Key Terms, Content, High-Yield, Mnemonics (collapsible)
- Per-lesson status: unread / read / reviewed (persisted in Dexie)
- Personal notes: write/preview tabs, debounced auto-save (800ms), rendered via `marked`
- "Practice this topic" launches a quiz scoped to the lesson's check questions + vmleSubject pool
- Mermaid life-cycle / flowchart diagrams (lazy-loaded)

### Flashcards (Phase 8)

- Deck built from a lesson's `keyTerms` array
- CSS 3D flip animation (front = term, back = definition)
- Mark known / unknown; retry-unknown loop; progress bar
- Route: `/flashcards/:lessonId`

### Study Planner + Task Tracker (Phase 9)

- **Study Plan tab**: exam countdown (days until Nov 4, 2026 by default), weekly question and lesson goal progress bars, per-subject readiness list
- **Tasks tab**: add/edit/delete tasks with title, subject, type, due date, status, notes
- Tasks grouped: Overdue / Today / This Week / Later / Done
- Planner settings (exam date, weekly goals) persisted in Dexie

### Backup / Restore (Phase 11, updated M1.6)

- **Export**: all 11 Dexie tables in BackupFileV2 (version: 2) — adds `flags`, `reviewEvents`, `contentPacks` vs v1
- **Import**: accepts v1 or v2; v1 missing tables default to `[]`; reads/writes via repository only (no direct Dexie calls)
- **Clear all**: wipes all 10 tables (attempts, progress, bookmarks, flags, importedQuestions, lessonStatus, lessonNotes, tasks, plannerSettings, reviewEvents); `contentPacks` excluded — must uninstall explicitly

### Dark Mode (Phase 11)

- Quasar `$q.dark.set()` toggle in Settings
- Persisted in `localStorage` under key `dvmr-dark`
- Restored on app mount (in `index.vue:onMounted`)

---

## Data Model (abbreviated)

```typescript
// Core question — see src/types/question.ts
interface Question {
  id: string; // e.g. "anat-0001"
  year: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Pre-DVM
  school?: 'UPLB' | 'CLSU' | 'PSAU' | 'CHED';
  vmleSubject: VmleSubject; // one of 9 PRC exam subjects
  competencyId: string; // e.g. "Veterinary Anatomy:A.1.1"
  stem: string;
  choices: { key: 'A' | 'B' | 'C' | 'D'; text: string }[];
  answer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  sourceType: 'own-notes' | 'ai-draft' | 'open-reference' | 'hand-written';
  source: string; // REQUIRED: textbook+page or URL
  status: 'unverified' | 'verified' | 'flagged';
}

// SRS state — see src/types/progress.ts
interface SrsProgress {
  questionId: string;
  attempts: number;
  correct: number;
  ease: number; // 1.3–4.0 (SM-2 ease factor)
  intervalDays: number;
  dueAt: number; // Unix ms timestamp
  lastSeenAt: number;
}
```

---

## IndexedDB Schema (Dexie v1–v8)

| Version | Tables Added / Changed              | Key / Index                                                |
| ------- | ----------------------------------- | ---------------------------------------------------------- |
| v1      | `attempts`                          | `++id`, indexed: `questionId, timestamp`                   |
| v2      | `progress`, `bookmarks`             | `&questionId` (unique)                                     |
| v3      | `importedQuestions`                 | `&id`, indexed: `vmleSubject, competencyId`                |
| v4      | `lessonStatus`, `lessonNotes`       | `&lessonId` (unique)                                       |
| v5      | `tasks`, `plannerSettings`          | `&id`, `tasks` also indexed: `dueAt, status`               |
| v6      | `flags`                             | `&questionId` (unique)                                     |
| v7      | `reviewEvents`                      | `++id`, indexed: `objectId, sessionId, ts, activityType`   |
| v8      | `contentPacks`; re-index `importedQuestions` | `contentPacks: &packId`; `importedQuestions` gains `*competencyIds, packId`; upgrade populates `competencyIds` |

---

## Key Domain Facts

- **9 VMLE subjects** (PRC PRB Res. 07 s.2024): Anatomy 10%, Physiology 10%, Zootechnics 12%, Pathology 10%, Pharmacology 10%, Medicine 14%, Microbiology & PH 14%, Parasitology 10%, Surgery 10%
- **100 items per subject exam** drawn by competency weight from Annex A
- **Passing**: weighted average ≥ 75%, no subject below 60% (secondary source; verify with PRC)
- **Next exam**: Nov 4–6, 2026 (secondary source; verify at prc.gov.ph)
- **Question sources**: all seed questions are `ai-draft / unverified`; Zod importer enforces source field on every question

---

## What Is Deferred

| Phase | Feature                                  | Gate                     |
| ----- | ---------------------------------------- | ------------------------ |
| 2     | Supabase accounts + synced shared bank   | When a second user joins |
| 4     | Submit/flag/verify workflow (2-approval) | Needs accounts           |
| 10    | Leaderboard, group mocks, shared notes   | Needs accounts           |

---

## M1 Foundation (completed 2026-10-23)

All 6 M1 items implemented across 6 commits (C1–C6). Tests: 60 → 108.

| Commit | Item | Key deliverable |
|--------|------|-----------------|
| C1 | M1.1 LearningObject + CompetencyRepository | `LearningObject` base type; `Question` gains `competencyIds`, `courseRefs`, `links`, `origin`, `updatedAt`, `version`; `CompetencyRepository` wraps TOS/curriculum loaders |
| C2 | M1.2 Activity registry | `ActivityDefinition<T>`, singleton `activityRegistry`, `mcqActivity`, `flashcardActivity`; `ReviewEvent` / `deriveRating()` |
| C3 | M1.3 Review event log | Dexie v7 `reviewEvents` table; repository methods; `quizStore` writes event + sessionId UUID on every answer |
| C4 | M1.4 Scheduler | `Scheduler` interface; SM-2 wrapper (fixes first-wrong `intervalDays: 0`); full FSRS via ts-fsrs; `localStorage dvmr-scheduler` feature flag; `quizStore` uses `getActiveScheduler()` |
| C5 | M1.5 Content packs | `ContentPackManifest`, `InstalledPack`; `applyInstall/Update/Remove` with user-modified-row protection; Dexie v8 (`contentPacks` + `*competencyIds` index); repository methods |
| C6 | M1.6 Backup v2 + clearAll fix | `BackupFileV2` (adds `flags`, `reviewEvents`, `contentPacks`); `importBackup` accepts v1 or v2; `backup.ts` uses repository only; `clearAll` covers 10 tables |

## Known Issues

1. ~~**Build blocked** — Node v22.13.0 installed; Quasar requires ≥ 22.22.0~~ **Fixed** — Node v22.23.4 in use.
2. **XSS risk** — `v-html` + `marked.parse()` on lesson notes lacks DOMPurify
3. ~~**N+1 on import**~~ Replaced by `bulkGet` + `bulkPut` in `importQuestions()`
4. ~~**SRS inconsistency** — first wrong answer stores `intervalDays: 1` but `dueAt: now`~~ **Fixed** in SM-2 scheduler wrapper (C4): stores `intervalDays: 0`

See [docs/audit-2026-10-22.md](docs/audit-2026-10-22.md) for the original findings table.
