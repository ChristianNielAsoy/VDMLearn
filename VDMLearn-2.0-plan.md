# VDMLearn 2.0 Plan

Goal: turn the 1.0 quiz/progress engine into a learning system with one loop: **learn > practice > apply > review**.
Scope: everything below, built in dependency order. Each milestone must be shippable on its own. Content writing is NOT a blocker for any milestone.

Based on: docs/audit-2026-10-22.md, CLAUDE.md, VDMLearn.md, locked decisions (owner first, friends later; both browse views; free tiers only; responsive).

## Definition of done (every milestone)

- lint, typecheck, tests, build all pass; new logic has unit tests
- migrations tested on a database upgraded from the previous version with sample data; backup/restore still works (old backups accepted)
- keyboard-only and 360/768/1280px checks on touched screens; no new a11y regressions
- no secrets, no paid services, no new dependency without owner approval
- VDMLearn.md, CLAUDE.md and docs/audit-checklist.md updated

## M0. Pre-work (refactor, already specified)

DB-driven questions/lessons (seed JSON only bootstraps, never overwrites user edits), XSS fix (DOMPurify, Mermaid strict), bulk import, SRS consistency, single source for "flagged" (flags table; status = unverified|verified; flagged derived).

## M1. Foundation

1. **Learning-object model**: base type `LearningObject` { id, type, competencyIds[], courseRefs[], links[], origin, status, updatedAt, version }. Types: question, lesson, card, diagram, case, note, drugCard, checklist, resource.
2. **Competency repository** built from vmle-tos-2024.json + curriculum JSONs (read-only reference data); query by competency, subject, course, school.
3. **Activity registry**: interface `Activity<T>` { render, grade, toEvent }. Wrap existing MCQ and flashcard as the first two activities.
4. **Review event log** (append-only): { id, objectId, activityType, correct, rating(1-4), confidence(1-3), responseMs, mode, sessionId, ts }. Derive rating from correctness + confidence + speed with a documented, configurable rule.
5. **Scheduler interface** with SM-2 and **FSRS** implementations; per-object state; feature flag; one-time conversion of existing SM-2 state with a documented mapping; ability to revert.
6. **Content packs**: manifest { packId, version, schemaVersion, files, checksum }; install/update/remove; never overwrite user-modified rows; shareable as a file.
7. Backup format v2 (accepts v1).
   Acceptance: all 1.0 tests pass; migration test from v6/v7 data; FSRS tests against reference vectors from the chosen library; no Dexie calls outside repositories.

## M2. Learning logic + UX shell

Logic first (pure functions, unit-tested), then screens.

- **Mastery** per competency: recent accuracy + memory strength (scheduler) + coverage. **Readiness** = sum(exam weight x mastery), compared with the pass rule (75% overall, no subject < 60%: configurable; verify with PRC). Always labeled an estimate.
- **Next-item priority**: overdue, weakness, exam weight, interleaving across subjects, new-item budget. **Leech** rule: repeated failures flag the item.
- **Bloom analytics**: tag questions by level; show performance by level (TOS gives totals per subject).
- **Design tokens**, navigation: Today, Learn, Practice, Visual, Progress, More (Planner, Settings).
- **Today screen**: due count, one Start button, weekly goal, exam countdown, 3 weakest competencies.
- **Session builder**: 10 / 20 / 45 min mixes due, new and weak items.
- **Focus mode**: minimal chrome, keyboard shortcuts (1-4, space), swipe, confidence tap, per-choice explanations.
- **Onboarding** (school, year, exam date) and **readiness heatmap + coverage view** (verified questions per competency vs exam items).
- **a11y pass** (WCAG 2.2 AA).

## M3. Review notes

- **Mistake journal**: on a wrong answer, one-tap reason (knowledge gap / misread / careless / mixed up with X) + optional line.
- **Competency notes**: Markdown with [[wiki links]] and backlinks (sanitized).
- **Review sheets**: auto-built per weak competency (wrong items, notes, key terms, linked diagram); export Markdown/PDF.
- **Cloze cards** from highlighted note text; **blurting mode** (write first, reveal key points, self-score); notes enter the review schedule.

## M4. Competency hub + resources

- One page per competency aggregating lessons, questions, cards, diagrams, cases, notes, resources and progress.
- **Resource registry**: external link, source name, license note, `verifiedBy`, type (atlas, reference, video, course). Link out only; do not embed or copy third-party content.
- Candidate link-outs (verify each site's terms): IMAIOS Vet-Anatomy, WikiVet, Merck Veterinary Manual, Plumb's/Compendium, Khan Academy, OpenStax, Chulalongkorn MOOC simulations.

## M5. Practical application

- **Calculators** (formula shown, units checked, study-only disclaimer): drug dose, fluid therapy estimate, feed formulation/ration (e.g., Pearson square), withdrawal period, epidemiology (prevalence, incidence, odds ratio, relative risk, sensitivity, specificity, PPV, NPV, sample size). Each has unit tests with worked textbook examples; formulas need a `verified` source before release.
- **Parametric question templates**: variables, formula, tolerance, units; unlimited randomized practice for compute items (Pharmacology A.3, Surgery A.2.4, Zootechnics B.3, Epidemiology G).
- **Skills checklists**: step-through, self-rated (necropsy, restraint, injection sites, suture patterns, physical exam).
- **Quick-reference cards** (normal values, gestation lengths, cycles): `verified` status required before display as fact.
- **Pre-DVM skill tree**: prerequisite graph from school curricula (PSAU has explicit prerequisites): Chemistry > Organic > Biochemistry > Physiology, etc.

## M6. Visual learning

- **Media model**: { id, kind, path, license, attribution, source, species }; attribution shown whenever displayed. Only own drawings or properly licensed images.
- **Hotspot diagram engine** (SVG regions, labels, layers, species toggle), **label-the-diagram quiz**, **image-occlusion cards**.
- **Step-through stepper** for life cycles and pathogenesis (replace static Mermaid where steps matter).
- **Image-based question items** (smears, radiographs, histology) supported by the media model.
- Out of scope: VR/AR and 3D atlases (link out).

## M7. Virtual patient cases

- JSON graph: nodes (signalment, history, exam, labs, imaging, decision, outcome), edges by decision, competency tags, score and debrief.
- Validator for imported cases; scoring mapped to competencies; replay with different choices.

## M8. Interop

- Export to Anki (CSV first, .apkg optional); import Anki CSV; Markdown export of notes; share content packs as files.

## M9. Accounts and verification (only when friends join)

Supabase auth, synced shared bank, 2-approval verification (no self-approval, source required), flags per user, leaderboard and group mocks (original Phases 2, 4, 10).

## Cross-cutting rules

- Study tool only; not clinical guidance. Show disclaimer on calculators and dosing content.
- Anything factual (doses, laws, normal values) needs a source and `verified` before it is shown as fact.
- No copyrighted textbook pages, leaked exam items, or third-party images without a license.
- Exam facts (pass rule, dates, session duration) are settings, not hardcoded, until verified at prc.gov.ph.

## Risks

| Risk                       | Mitigation                                                        |
| -------------------------- | ----------------------------------------------------------------- |
| Scope creep                | One milestone at a time; each shippable                           |
| Migration data loss        | Non-destructive, tested, backup first                             |
| Wrong calculators or facts | Unit tests with textbook examples, source required, verified flag |
| Image licensing            | Media model with license + attribution; link out otherwise        |
| FSRS misconfiguration      | Feature flag, revert path, reference-vector tests                 |
| Over-claiming readiness    | Label as estimate; show coverage next to it                       |
