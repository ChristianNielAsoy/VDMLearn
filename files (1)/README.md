# VDMLearn Content Pack 001 (author draft)

Everything here is **unverified**. It was written from general knowledge, not copied from any book. Verify each item against a real reference (by reading the section yourself) at least 24 hours after first seeing it.

## What is inside

| Item                                                                 | Count | Path                                    |
| -------------------------------------------------------------------- | ----- | --------------------------------------- |
| Lessons (Markdown, with objectives, key terms, high-yield, mnemonic) | 7     | lessons/                                |
| Diagrams (own SVG drawings, CC0)                                     | 4     | diagrams/                               |
| Hotspot definition for the ruminant stomach diagram                  | 1     | diagrams/ruminant_stomach.hotspots.json |
| MCQs tagged with official PRC competency ids                         | 41    | questions-vmle.json                     |
| MCQs for Year 0 (PRE ids, no PRC subject)                            | 14    | questions-year0.json                    |
| Year 0 topic list (draft, 6 areas, 70 topics)                        | 1     | year0-taxonomy.json                     |
| Source registry with license and AI-use notes                        | 11    | sources.json                            |

## Lessons

1. Ruminant digestive system (Zootechnics B.1, Physiology B.1)
2. Epidemiologic measures and diagnostic tests (Microbiology and Public Health G.3)
3. Dose, dilution and fluid calculations (Pharmacology A.3, B.4; Surgery A.2.4). All numbers are practice values.
4. Cell, membrane transport and body fluids (Physiology A.1-A.3)
5. Fasciola (liver fluke) (Parasitology C.3, C.5, C.6, C.7)
6. Mendelian genetics and selection response (Zootechnics A.2, A.3)
7. pH, buffers and acid-base balance (Physiology B.7; Year 0 chemistry)

## Checks already done

- Every VMLE competency id exists in vmle-tos-2024.json; every PRE id exists in year0-taxonomy.json.
- Every worked calculation was recomputed with code; every question has four distinct choices and exactly one key.
- Diagrams were rendered and inspected.
- NOT done: checking facts against a published reference.

## Known limits

- Answer keys lean toward B and C. The app should shuffle the choices at display time (keep "Cannot be determined" last).
- Year 0 questions use `vmleSubject: null` and PRE competency ids; they will not import until the app supports them (milestone V3).
- Lessons use the template in CLAUDE.md; the app's lesson JSON may differ, so convert them.
- Species-specific facts (e.g., Fasciola species in the Philippines) are flagged to check with local references.
- Doses and fluid rates are made-up practice numbers, not clinical guidance.

## How to use

1. Read each lesson, then do its questions. Verify as above before marking anything verified.
2. Copy this folder into the repo as `content/pack-001/`.
3. Paste the prompt below into Claude Code.

## Claude Code prompt

```
Read CLAUDE.md, VDMLearn.md, docs/VDMLearn-2.1-plan.md, docs/content-intake.md and content/pack-001/README.md. Task: load content pack 001 into the app. Plan first and WAIT for my OK.
1. Import content/pack-001/questions-vmle.json through the existing import path. Everything must be status "unverified". Report any validation errors; do not edit the questions to make them pass without telling me.
2. Convert the 7 lessons in content/pack-001/lessons/ to the app's lesson format (read src/types/lesson.ts and the sample lessons first). Keep text unchanged; map competencyIds, objectives and key terms.
3. Register content/pack-001/sources.json in the source registry (add the aiIngestion field if missing).
4. Wire ruminant_stomach.svg with ruminant_stomach.hotspots.json to the hotspot diagram engine; add a label-the-diagram quiz for it. Show the other three SVGs in their lessons.
5. Shuffle answer choices at display time (keep "Cannot be determined" last).
6. Do NOT import questions-year0.json or year0-taxonomy.json yet; list what is needed to support PRE ids (milestone V3).
Small commits; lint, typecheck, tests and build must pass; update VDMLearn.md.
```
