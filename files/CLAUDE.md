# DVM Reviewer — Project Context & Plan

Study app for the Philippine Doctor of Veterinary Medicine (DVM) program and the Veterinary Licensure Exam (VMLE). Built with Quasar (Vue 3). Single user first, multi-user later.

## Project files (where things live)

```
dvm-reviewer/
  CLAUDE.md                          <- this file (project root)
  src/data/
    vmle-tos-2024.json               <- official PRC topics (main backbone)
    curriculum.cmo2018.json          <- CHED national sample curriculum
    curriculum.uplb2018.json
    curriculum.clsu2024.partial.json <- Years 1-3 only
    curriculum.psau2018.json
  docs/
    reference/vmle-topics.clsu-leap.json  <- legacy pre-2024 syllabus, reference only
    sources/                         <- original PDFs/screenshots (PRC Annex A, UPLB, PSAU, CLSU). Keep the repo PRIVATE.
```

On first run, if these files are in the project root instead, move them to the paths above and fix any imports.

## Goals

- Review by year > subject > topic, aligned to the PH DVM curriculum.
- VMLE-style MCQ practice, flashcards, timed mock boards.
- Free-to-run: no paid APIs. Questions are generated outside the app (Claude chat/Claude Code) and imported as JSON.
- Spaced repetition and weak-topic tracking.
- Works offline (PWA); mobile build via Capacitor later.

## Stack

- Quasar CLI + Vite, Vue 3 `<script setup>`, TypeScript, Pinia, Vue Router
- Local data: IndexedDB via Dexie (progress, SRS state, notes)
- Question bank: JSON files in `src/data/questions/`
- **No AI API calls in the app (cost = 0).** AI-assisted content is made offline and imported via a JSON import page.
- Hosting: free tiers only (Cloudflare Pages or Vercel; Supabase free). Verify current free-tier limits and pausing rules before launch.
- Optional later: Supabase auth + sync
- Modes: SPA/PWA first. Capacitor (Android) after the MVP.

## Domain context (verified)

- CHED CMO No. 1, s. 2018 sets the DVM PSG: 6 years = 1 prep/GE year + 5 professional years.
- Reference curricula: CHED CMO 1 s.2018 (national minimum), UPLB CVM 2018-2019 (221 units).

### VMLE (PRC Board of Veterinary Medicine)

- Legal basis: RA 9268 Sec. 14 lists 8 subjects: Parasitology; Pharmacology; Veterinary Medicine (incl. Ethics, Surgery, Animal Welfare, Jurisprudence); Zootechnics (incl. Animal Behavior, Environmental Health); Microbiology and Public Health; Physiology; Anatomy; Pathology.
- Latest table of specifications: PRB Resolution No. 07 s. 2024, "Enhanced Tables of Specifications", effective Oct 2024 VLE onward. It split Medicine and Surgery into separate subjects (9 exam subjects). Annex A (topic-level TOS) has been obtained and transcribed: see `vmle-tos-2024.json`.
- Weights (PRC advisory, effective Oct 2025 exam):

| Day | Subject                                   | Weight |
| --- | ----------------------------------------- | ------ |
| 1   | Veterinary Anatomy                        | 10%    |
| 1   | Veterinary Physiology                     | 10%    |
| 1   | Zootechnics                               | 12%    |
| 2   | Veterinary Pathology                      | 10%    |
| 2   | Veterinary Pharmacology                   | 10%    |
| 2   | Veterinary Medicine                       | 14%    |
| 3   | Veterinary Microbiology and Public Health | 14%    |
| 3   | Veterinary Parasitology                   | 10%    |
| 3   | Veterinary Surgery                        | 10%    |

- Passing (secondary sources; verify with PRC): weighted general average of 75% with no subject below 60%. A PRC exam program for a Nov 2026 sitting exists on prc.gov.ph; confirm dates there.
- Pass rates: Oct 2023 92/985; Oct 2024 633/1,349 (47%); Oct 2025 1,108/1,433 (77.32%, secondary source supertutor.ph; verify with PRC).
- Next sitting reported as Nov 4-6, 2026, computer-based (secondary source; confirm on prc.gov.ph).

### VMLE topic taxonomy (OFFICIAL: PRC Annex A)

`vmle-tos-2024.json` is transcribed from PRC Board of Veterinary Medicine Resolution No. 07 s.2024, Annex "A" (Enhanced Tables of Specifications, effective Oct 2024 VLE onward; user-provided PDF). It covers all 9 exam subjects. Structure: subject > section (A, B, ...) > topic/competency > sub-competency, each with `items` out of 100 per subject exam. All sums are machine-checked (items sum to 100 per subject; parent = sum of children; exam weights sum to 100).

- This is THE topic backbone for `curriculum.ts`, question tagging (`vmleSubject`, `section`, `competency`) and mock-exam drawing. A full mock = 100 items per subject drawn by competency `items`, scaled by `examWeightPct`.
- Share of one competency in the whole exam = items/100 x examWeightPct.
- Bloom totals per subject are stored as printed; row-level Bloom levels are not recorded (scan alignment was unreliable). Use them to balance recall vs analysis questions (e.g., Pathology is 60% Analyzing; Surgery is 53% Understanding).
- `vmle-topics.clsu-leap.json` is the OLDER 8-subject syllabus (pre-2024). Keep only as a source of extra subtopic detail (e.g., protozoa genera); it is superseded wherever it disagrees with the TOS.
- Printed oddities are listed in the JSON `_meta` (e.g., Physiology A skips item 5; Medicine H.3 prints RA 8585, probably RA 8485 as amended by RA 10631).
- Sample questions from the CLSU site were NOT copied. Write original questions per competency.
- Course-to-subject mapping (`vmleSubject`) in the curriculum JSONs matches the TOS groupings. Exceptions: Environmental Animal Health and Biosafety has no explicit TOS line (kept under Zootechnics per RA 9268); Organic Chemistry, Biostatistics, Research Methods are not examined directly but feed the TOS (Biochemistry > Physiology B.3-B.4; Biostatistics > Epidemiology G; Genetics > Zootechnics A; Nutrition > Zootechnics B; dose computation > Pharmacology A.3).

### Curriculum (official sample program, CHED CMO No. 1, s. 2018)

Source: full CMO text (minimum 229 units: GE 36, PE/NSTP 14, Basic Science 12, Zootechnics 22, Veterinary Medical Science 145). Machine-readable seed: `curriculum.cmo2018.json` (copy to `src/data/`; totals verified = 229 units). CMO No. 1 s.2018 is still the governing national standard (no newer CMO found as of Oct 2026; legaldex copy is unverified for amendments, so check CHED). This is CHED's SAMPLE program; schools reorder it. UPLB (221 units), VSU (243), CLSU (233) and PSAU (261) differ, so always `school`-tag overrides.

| Year | Sem 1                                                                                                                                                                | Sem 2                                                                                                                                                                                       |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | GE (Self, PH History, Math, STS, Ethics), Organic Chemistry, PE, NSTP                                                                                                | GE (Contemporary World, Purposive Comm, 3 electives), Biochemistry, PE, NSTP                                                                                                                |
| 2    | Biostatistics, Animal Production and Economics, Animal Nutrition, Breeding and Genetics, Animal Welfare, Embryology, Gross Anatomy                                   | Poultry Production, Histology, Ruminant Production, Equine Production, Comparative Anatomy, Art Appreciation                                                                                |
| 3    | Rizal, Swine Production, General Physiology, General Microbiology, General Pathology, Basic Pharmacology                                                             | Systemic Physiology, Bacteriology and Mycology, Entomology and Protozoology, Clinical Pharmacology, Systemic Pathology                                                                      |
| 4    | Reproductive Physiology and Endocrinology, General Principles of Vet Medicine, Virology, Helminthology, Clinical Pathology, Principles of Surgery and Anesthesiology | Immunology, Poultry Med, Ruminant Med, Diagnostic Imaging, Small Animal Surgery, Research Methods, Canine Med, Feline Med                                                                   |
| 5    | Epidemiology, Food Safety and Hygiene, Large Animal Surgery, Equine Med, Swine Med, Lab Animal Medicine, Jurisprudence and Ethics, Intro to Clinics                  | Zoonoses/EIDs/One Health, Aquaculture and Aquatic Medicine, Apiculture/Wildlife, Theriogenology, Practice Management, Environmental Animal Health and Biosafety, Clerkship, Thesis 1, CPC 1 |
| 6    | CPC 2, Internship 1 (10 units), Thesis 2                                                                                                                             | Internship 2 (12 units)                                                                                                                                                                     |

- Pre-DVM head start (Year 0), common across UPLB, CLSU, PSAU: General/Inorganic Chemistry (UPLB CHEM 18, PSAU BP-GIC), Principles of Biology and Zoology (PSAU), Organic Chemistry, Biochemistry, Statistics/Biostatistics, Genetics and Molecular Biology (PSAU), then Animal Production, Nutrition, Breeding. Anatomy/Physiology/Microbiology come next (UPLB and CLSU Year 2, PSAU Year 3).
- `vmleSubject` mapping follows RA 9268 Sec. 14 where it speaks (Animal Welfare, Ethics, Jurisprudence, Surgery under Veterinary Medicine; Environmental Health under Zootechnics) and is otherwise an assumption. Verify against PRC Enhanced TOS Annex A and correct the JSON.
- CHED Annex E lists recommended references per subject (e.g., Dyce/Sack/Wensing anatomy, Reece physiology, Cheville pathology, Urquhart parasitology, Merck Veterinary Manual for swine). Editions are dated; use titles as a reading guide only.

### School curricula found online

| School | Status                                                                                                                                                                                                     | File                               |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| CLSU   | Official Office of Admissions form, BOR Res. 43-2024, effective SY 2024-2025, 233 units. Years 1-3 captured from a student-uploaded Studocu copy; Years 4-6 NOT captured.                                  | `curriculum.clsu2024.partial.json` |
| UPLB   | Official 2018-2019 Revised DVM Curriculum (user-provided PDF), 221 units, all 6 years captured. Semester totals re-verified.                                                                               | `curriculum.uplb2018.json`         |
| PSAU   | 'Revised Program Curriculum as per CMO 1 s.2018' (4 user-provided screenshots), 261 units (281 for non-STEM students incl. 20-unit bridging program). All years captured; per-semester totals re-verified. | `curriculum.psau2018.json`         |

UPLB specifics: Year 1 has University Chemistry + lab (CHEM 18/18.1), Basic Organic Chemistry + lab (CHEM 40/40.1), Statistics for the Biological Sciences (STAT 164) and Animal Welfare; Biochemistry is split into CHEM 160 (3) + VPHY 140 (2) in Year 2; Anatomy starts Year 2 (Macroscopic Anatomy I = 5 units); Food Hygiene is 4 units in Year 5; thesis (VMED 200) spans Years 5-6; Jurisprudence, Ethics and Economics and Laboratory Diagnostics are in Year 6.

PSAU specifics: Years 1-2 are science-heavy with explicit prerequisite chains (Principles of Biology > General Zoology; General and Inorganic Chemistry > Organic Chemistry > Biochemistry (5 units); Introduction to Molecular Biology; Biostatistics; many "AS" animal-science courses incl. Aquaculture, Laboratory Animal Production, Wildlife/Zoo/Apiculture). Veterinary anatomy/physiology/microbiology start Year 3. NCII animal-production training in the Year 2 mid-year term; internship is off-campus and long (Clinics 233/235/237 = 30 units). Bridging program (non-credit, required) for non-STEM students: BP-GIC, BP-PB 1, BP-IT1 before Year 1, then BP-FS, BP-P (Physics), BP-PB 2 (Genetics). ASK PSAU whether bridging applies to a college graduate.

Notable CLSU differences vs CMO sample: Ethology and Organic Chemistry (4 units) in Year 1; Biochemistry Year 1; Anatomy starts Year 2; Epidemiology, Virology and Immunology already in Year 3; Mid-year term in Year 2. Prerequisite chains are recorded (e.g., Biochemistry needs Organic Chemistry; General Physiology needs Biochemistry and Gross Anatomy).

## User context & target schools

- Owner is an IT graduate (non-allied field) planning to enroll in a DVM program in 1-2 years, so v1 content starts with a **Pre-DVM track** (Year 0): General Biology, General Chemistry, Organic Chemistry, Biochemistry, Statistics, Intro to Animal Production. Then Year 2 Anatomy/Physiology/Microbiology as a head start.
- Taxonomy must allow `year: 0` (Pre-DVM) in addition to 1-6.
- Target schools: UPLB CVM, CLSU (College of Veterinary Science and Medicine), PSAU CVM (Magalang, Pampanga). Each school's curriculum differs: add a `school` tag to topics/lessons where content is school-specific, and keep a shared core aligned to the VMLE.
- Admission rules vary by school and change yearly; verify with each registrar. Track deadlines in the school tracker (Phase 9).

## Content model

Hierarchy: Year > Subject > Topic > Subtopic. Each subject maps to one `vmleSubject`. Topic list must come from the target school's syllabus (placeholder topics are fine until then). Example: Anatomy > Osteology, Arthrology, Myology, Splanchnology, Neurology, Angiology.

### Two taxonomies (school track + PRC track)

1. **School track:** Year > Semester > Course > Topic (from the school curriculum).
2. **PRC / VMLE track:** VMLE Subject (9) > Topic > Subtopic, taken from the PRC Enhanced Table of Specifications (Board Res. No. 07 s.2024, Annex A). Each topic carries its PRC weight when Annex A provides it.

- A school Topic maps to zero or more PRC Topics (many-to-many via `topic_map`). Subject-level mapping exists now (`vmleSubject` in the JSON); topic-level mapping is blocked until Annex A is imported.
- Every question stores `topicId` (school track) and `vmleTopicId` (PRC track, nullable until Annex A is loaded). Dashboard and mock exams for board prep use the PRC track; coursework review uses the school track.
- Placeholder: create `src/data/prc-tos.json` with the 9 subjects and weights now; fill topics when Annex A is available. App must work with `vmleTopicId = null`.

### Lesson template (markdown + frontmatter)

- Frontmatter: id, year, subject, topic, vmleSubject, objectives[]
- Sections: Overview, Key terms, Content, High-yield (VMLE), Mnemonics, Check questions (3-5 question ids)
- Status per user: unread / read / reviewed

### Activity types (after quiz core works)

Flashcards, label-the-diagram, matching (drug-class, parasite-host), case scenarios (signs > diagnosis > treatment), fill-in-the-blank.

### Exam types (one engine, different filters)

Topic quiz, subject exam, full weighted VMLE mock, wrong-answers-only review.

### Notes

Personal notes per topic (private by default, optional share with friends).

### Study planner

Weekly goals, daily "Due today" count, exam date countdown, readiness score per VMLE subject.

### School tracker (later phase, keep simple; not an LMS)

Task: id, title, subject, type (homework/lab/report/exam/requirement), dueAt, status (todo/doing/done), notes, optional topicId. Views: list, calendar/week, overdue. Personal first; optional shared class board later.

## Data model

```ts
type Question = {
  id: string; // e.g. "anat-0001"
  year: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Pre-DVM
  school?: 'UPLB' | 'CLSU' | 'PSAU' | 'CHED'; // course tag for the "By my course" view
  courseCode?: string; // e.g. "VPHY 141", from curriculum JSON
  subject: string; // course name
  vmleSubject: VmleSubject; // one of the 9 PRC subjects
  competencyId: string; // PRC Annex A id, e.g. "Pharmacology:A.1.1" (required for "By exam topic" view and mocks)
  stem: string;
  choices: { key: 'A' | 'B' | 'C' | 'D'; text: string }[];
  answer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  sourceType: 'own-notes' | 'ai-draft' | 'open-reference' | 'hand-written';
  source: string; // REQUIRED: textbook+page, notes ref, or URL
  status: 'unverified' | 'verified' | 'flagged';
  approvals?: { userId: string; source: string; at: number }[]; // verified when >= 2 distinct approvers, none = author
};

type Progress = {
  questionId: string;
  attempts: number;
  correct: number;
  ease: number;
  intervalDays: number;
  dueAt: number;
  lastSeenAt: number;
};
```

```ts
type Topic = { id; subjectId; name; parentId?; order };
type VmleTopic = {
  id;
  vmleSubject;
  name;
  parentId?;
  weight?: number;
  source: 'PRB Res 07 s.2024 Annex A';
};
type TopicMap = { topicId; vmleTopicId };
type Note = { id; userId; topicId; bodyMd; shared: boolean; updatedAt };
type LessonStatus = { userId; lessonId; status: 'unread' | 'read' | 'reviewed' };
type SchoolTask = {
  id;
  userId;
  title;
  subject;
  type: 'homework' | 'lab' | 'report' | 'exam' | 'requirement';
  dueAt: number;
  status: 'todo' | 'doing' | 'done';
  notes?;
  topicId?;
};
```

## Folder structure

```
src/
  data/curriculum.ts        # years, subjects, VMLE weights
  data/questions/*.json     # one file per subject
  db/dexie.ts               # IndexedDB schema
  stores/                   # pinia: quiz, progress, settings
  services/srs.ts           # SM-2 scheduling
  services/importer.ts      # validate + import question JSON (zod)
  pages/                    # Browse, Quiz, Flashcards, Mock, Dashboard, Tutor
  components/               # QuestionCard, ChoiceList, ProgressRing, etc.
```

## Scope decision

v1 must serve BOTH: (a) solo review that beats Anki, and (b) a shared friends bank with verification. Architecture is **local-first, synced**: Dexie works offline; Supabase holds the shared bank, accounts and synced progress. Solo mode must stay fast and usable offline.

### Positioning vs existing tools

Legend: Y yes, P partial, N no, ? not confirmed. Petipedia, Veterinary Flashcards, IMAIOS and Plumb's come from web search; Anki and Quizlet/Brainscape ratings are from general knowledge (re-check before relying on them).

| Feature                                                 | Petipedia        | Anki                | Quizlet / Brainscape | IMAIOS Vet-Anatomy | Plumb's / Compendium | This app                            |
| ------------------------------------------------------- | ---------------- | ------------------- | -------------------- | ------------------ | -------------------- | ----------------------------------- |
| MCQ question bank                                       | Y                | P (DIY decks)       | P                    | N                  | N                    | Y                                   |
| PH curriculum / VMLE aligned (PRC Annex A)              | N (NAVLE/VTNE)   | N                   | N                    | N                  | N                    | Y                                   |
| Weighted timed mock exam                                | ?                | N                   | N                    | N                  | N                    | Y (Phase 5)                         |
| Spaced repetition                                       | ?                | Y                   | P                    | N                  | N                    | Y (Phase 3)                         |
| Lessons / articles                                      | Y                | N                   | N                    | N                  | P                    | Y (Phase 7)                         |
| Labeled anatomy visuals                                 | Y                | P (image occlusion) | N                    | Y                  | N                    | P (Phase 8, own SVGs)               |
| Mind maps / flowcharts                                  | Y                | N                   | N                    | N                  | N                    | Y (Phase 8)                         |
| Drug reference                                          | Y                | N                   | N                    | N                  | Y                    | P (drug cards, Phase 8)             |
| AI inside the app                                       | N                | N                   | N                    | N                  | N                    | N (AI-assisted JSON import instead) |
| Custom content from own notes                           | N                | Y                   | Y                    | N                  | N                    | Y                                   |
| Shared bank with friends                                | N                | P (deck sharing)    | Y                    | N                  | N                    | Y (Phase 2+)                        |
| Verified vs unverified questions (2 approvals + source) | N                | N                   | N                    | n/a                | n/a                  | Y (Phase 4)                         |
| Offline                                                 | ?                | Y                   | P                    | ?                  | ?                    | Y (PWA)                             |
| Cost                                                    | subscription (?) | free                | freemium             | paid               | paid                 | free (free tiers only)              |

- Our edge: PH/VMLE alignment, official-TOS-weighted mocks, free to run, friends-verified bank, AI-assisted import.
- Copy: Petipedia's all-in-one layout; Anki's spaced repetition.
- Out of scope: 3D atlases, full drug handbooks (link out to IMAIOS, Plumb's).

## Build plan

**Phase 1: MVP quiz (local)**

- Scaffold Quasar (TS, Pinia, Router, PWA). `curriculum.ts` generated from `curriculum.cmo2018.json` (Year > Semester > Course > Topic; topics from `vmle-tos-2024.json`, mapped to courses by `vmleSubject`). Browse + Quiz pages. 20 sample questions in JSON. Instant feedback + explanation.

**Phase 2: Accounts + shared bank (Supabase), only when friends are added**

- Auth (email/OAuth). Tables: `questions`, `progress`, `flags`, `profiles`. Row Level Security: users read all questions, write only own progress, submit questions as `unverified`.
- Dexie cache + sync so the app works offline.

**Phase 3: Progress, SRS, dashboard**

- SM-2 scheduling, "Due today" queue, accuracy per subject and VMLE subject, weak topics, bookmarks.

**Phase 4: Contribute, flag, verify**

- Submit/edit questions. Flag "wrong/unclear". Verifier role marks `verified` with a source. Unverified badge in UI; filter verified-only.

**Phase 5: Mock board exam**

- Weighted by VMLE percentages and per-competency `items` from `vmle-tos-2024.json` (100 items per subject), timed 2-hour blocks (PRC program: 8:00-10:00, 11:00-1:00, 2:00-4:00), review wrong answers.

**Phase 6: Import tools (replaces AI tutor)**

- JSON import page with schema validation; imported questions saved `unverified`.
- Question-generation prompt template in `docs/generate-questions-prompt.md`, used in Claude chat, then paste the JSON output.
- Per-question "notes" field for mnemonics and extra explanation, written by me or friends.

**Phase 7: Lessons + notes**

- Markdown lessons per topic using the lesson template; read/unread status; check questions link to the bank; "Practice this topic" button; personal notes per topic.

**Phase 8: Activities + visuals**

- Flashcards, matching, case scenarios, fill-in-the-blank.
- Hotspot anatomy diagrams (start: one species, one system), label-the-diagram quiz, Mermaid life cycles (Parasitology), drug cards. Only own or properly licensed images.

**Phase 9: Study planner + school tracker**

- Weekly goals, exam countdown, readiness score per VMLE subject.
- School tracker: tasks with due dates, list + week view, overdue highlight, link to topics. Personal first.

**Phase 10: Social**

- Weekly leaderboard (opt-in), group mock exams, shared notes, optional shared class task board.

**Phase 11: Polish**

- Import/export backup, dark mode, reminders/notifications (PWA), Capacitor Android build.

### Locked decisions (made with the owner)

1. **Users:** Owner first, friends later. Phase 1 has NO login; all data local (Dexie). Accounts and Supabase arrive only when friends are added; keep the data layer behind a repository interface so sync can be added without rewriting UI.
2. **Organization:** Both views with an easy switch: "By exam topic" (PRC competencies, default for exam prep) and "By my course" (year/course by school). Every question carries both tags.
3. **Accounts:** Only at the friends stage (follows from 1).
4. **Verification:** Any group member may verify. A question becomes `verified` after >= 2 approvals from distinct users; the author cannot approve their own question; each approval must cite a source (textbook + page). Flagging returns a question to `flagged`.
5. **Content sources:** Mixed (own notes, AI drafts, open references, hand-written). Every question records `sourceType` and a required `source`. AI-drafted and imported questions start `unverified` with a visible badge.
6. **Devices:** Responsive design, phone and desktop equal. Use Quasar responsive layout; test at 360px, 768px and 1280px widths; touch targets >= 44px.

### Still open

- Admission rules for degree holders (UPLB, CLSU, PSAU) and whether PSAU's bridging program applies.
- CLSU Years 4-6 curriculum.
- Official PRC passing rule and next exam dates (verify at prc.gov.ph).
- Copyright rule stands: no textbook pages or leaked board questions in the shared bank.

## Rules for Claude Code

- Keep answers and code concise; no unrequested refactors.
- TypeScript strict; Vue 3 `<script setup>`; Quasar components over custom CSS.
- No paid services or API keys. Only free tiers. Supabase keys (anon) in `.env`, gitignored.
- Imported/AI-generated questions must set `verified: false` and show an "unverified" badge in the UI.
- Add a medical disclaimer: for study only, not clinical guidance.
- After each phase: run lint + typecheck, and summarize what changed.

## First task

Start Phase 1 with the Pre-DVM (year 0) track as seed content (keep Phase 2 Supabase in mind when designing the data layer). Scaffold the project with `npm init quasar`, create `curriculum.ts` and the 20-question sample set, then build the Browse and Quiz pages.
