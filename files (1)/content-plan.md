# VDMLearn Content Plan (all three tracks)

Companion to docs/content-intake.md (workflow, source rules, prompt templates) and docs/VDMLearn-2.1-plan.md (V3 Year 0 taxonomy, V4 content engine).
Principle: breadth first. The PRC exam spreads weight across 205 competency lines (largest single line is about 2.5% of the whole exam), so cover many topics lightly before deepening any.
Every item: competency id + sourceId + locator + status `unverified` until checked against the page at least 24 hours later.

## Lanes

| Lane                | Content                                                                                                                                        | When                             | Pilot target                   |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- | ------------------------------ |
| A. Pre-DVM sciences | General/inorganic chemistry, organic chemistry, biochemistry, biology/zoology, genetics/molecular biology, statistics, intro animal production | Now (owner enrolls in 1-2 years) | 100 verified questions + notes |
| B. VMLE bank        | 9 PRC subjects, 100 items per subject exam                                                                                                     | Alongside A, lower share of time | 180 verified (20 per subject)  |
| C. Year 2+ subjects | Anatomy, physiology, zootechnics from school slides and textbooks                                                                              | After enrollment                 | Set when enrolled              |

## Capacity model (assumptions: measure in week 1, then replace)

- Assume about 6 minutes of owner time per VERIFIED question (read section, generate, check against page).
- Example: 6 hours/week is about 60 verified questions/week; the 280-question pilot (A + B) is about 5 weeks.
- Suggested split: A 50%, B 40%, C prepare-only 10% (until enrolled).
- Owner sets weekly hours: ____ (fill in).

## Lane A: Pre-DVM

Course union across the three target schools (codes from the curriculum JSONs):

| Topic area                             | UPLB               | PSAU               | CLSU                         |
| -------------------------------------- | ------------------ | ------------------ | ---------------------------- |
| General/inorganic chemistry            | CHEM 18 (+lab)     | BP-GIC             | not listed in captured years |
| Biology / zoology                      | not listed         | BP-PB 1, GE-Zoo 1  | not listed                   |
| Organic chemistry                      | CHEM 40 (+lab)     | Chem 1             | CHEM 1206                    |
| Biochemistry                           | CHEM 160, VPHY 140 | Chem 2             | CHEM 1222                    |
| Genetics / molecular biology           | not listed         | BP-PB 2, Mol Bio 1 | not listed                   |
| Statistics                             | STAT 164           | BP-FS, Biostat     | STAT 2205                    |
| Physics                                | not listed         | BP-P               | not listed                   |
| Animal production, nutrition, breeding | ZOTC 111, 112, 113 | AS 100, 101, 102   | ZOOT 1100, 1105, 1110        |

Steps:

1. **Taxonomy (V3):** draft topic lists at table-of-contents level from the chosen open textbooks; owner approves; ids like `PRE:CHEM-ORG:...`.
2. **Sources:** OpenStax Biology 2e, Concepts of Biology, Microbiology, Chemistry, Introductory Statistics as READING references (current terms: CC BY-NC-SA 4.0 and no ingestion into AI tools without OpenStax permission, so do not paste them into Claude; check each book's page). Content pack 001 gives you author-written drafts to verify against them. Organic chemistry, biochemistry and animal science: no open source confirmed yet. Options: your own notes, a library textbook (own-words only), government/extension publications (check terms).
3. **Chunk and generate** with docs/content-intake.md templates; 8 questions + notes + 5 cloze cards per section.
4. **Pilot split (100):** biology/zoology 20, general chemistry 20, organic 15, biochemistry 20, statistics 15, animal production 10.

## Lane B: VMLE

Start with source-light competencies (little or no copyrighted text needed), then widen:

| Order | Competencies                                                                                                                                                                                             | Why                                                                                                                            |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| 1     | Calculation-based: Pharmacology A.3 (dose computation), Surgery A.2.4 (fluid therapy), Zootechnics B.3 (feed formulation), Epidemiology G (prevalence, odds ratio, sensitivity/specificity, sample size) | Parametric templates need methods, not book text; formulas still need a verified source and unit tests                         |
| 2     | Ethics and Jurisprudence (Medicine F), Animal Welfare (Medicine H)                                                                                                                                       | Laws and official texts: not copyrightable (IP Code Sec. 175/176); verify the Animal Welfare Act citation (TOS prints RA 8585) |
| 3     | Histology and embryology (Anatomy C, D)                                                                                                                                                                  | Open textbook "Veterinary Histology" listed as openly licensed by a university guide (check license)                           |
| 4     | Remaining subjects, highest-weight lines first                                                                                                                                                           | Use CHED recommended references (older editions), school syllabus, library copies; own-words notes only                        |

Per subject pilot: 20 questions spread across its sections by item weight (see vmle-tos-2024.json). Also record Bloom level so the mix follows each subject's TOS totals.
Bottleneck to solve: most veterinary texts are not open. Owner action: find library or purchase access for the CHED reference titles.

## Lane C: Year 2+ (after enrollment)

- Use the school syllabus and professors' slides (private; never in shared packs unless the professor allows it).
- Prepare now only: source registry entries per course, the intake templates, and the folder layout.

## Milestones

| ID  | Milestone                  | Done when                                                                                                          |
| --- | -------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| C0  | Setup                      | Private repo folder `content/`, source registry entries for every source in use, templates saved, weekly hours set |
| C1  | Year 0 taxonomy approved   | JSON validated by tests; owner signed off topic lists                                                              |
| C2  | Lane A pilot               | 100 verified Year 0 questions + notes for each pilot topic                                                         |
| C3  | Lane B pilot               | 180 verified questions (20 per subject), starting with calculation and law competencies                            |
| C4  | Notes for top competencies | Notes for the 20 competency lines with the largest exam share                                                      |
| C5  | Review and scale           | Measured minutes per verified question, rejection rate, coverage gaps; next targets set                            |
| C6  | Lane C                     | Starts after enrollment                                                                                            |

## Quality gates

- Weekly: review the coverage dashboard; pick the next gaps.
- Track: minutes per verified question, % rejected, % flagged later.
- Never verify in the same sitting as creation (24-hour rule).
- Doses, withdrawal periods, laws, normal values: source required before verified.
- Keep a rejected-items log to improve prompts.

## Owner decisions needed

1. Weekly hours for content.
2. Library or purchase access for CHED reference titles.
3. Where verified content lives (content packs in the repo vs only in the app); keep the repo private.
4. Whether to start with Lane A only for two weeks to test the workflow.
