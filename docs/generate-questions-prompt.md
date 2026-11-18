# Question Generation Prompt Template (v2)

Use this in Claude (chat or Claude Code) to generate questions for the import page.
Copy the output JSON, paste it into `/import`, validate, and import.

> **Verification rule**: wait at least 24 hours after import, then cross-check every question
> against the cited source page before marking it `verified`. The app enforces this.

---

## Prompt Template

```
Generate [N] MCQ questions for the topic below. Output ONLY a valid JSON array — no prose,
no markdown fences, no code blocks.

Competency ID: [required — from vmle-tos-2024.json OR a Pre-DVM id like "PRE:BIOCHEM:B.2"]
Topic text:    [paste exact topic text, e.g. "Glycolysis and gluconeogenesis"]
Subject:       [one of the 9 VMLE subjects OR the Pre-DVM course title]
Year:          [DVM year 0–6; 0 = Pre-DVM]
Course:        [course name as in curriculum, e.g. "Clinical Biochemistry"]
School (opt.): [UPLB | CLSU | PSAU | CHED — omit for generic]
Bloom level:   [one of R (Remembering) | U (Understanding) | Ap (Applying) |
                An (Analyzing) | E (Evaluating) | C (Creating)]

Requirements:
- Exactly 4 choices (A, B, C, D), one correct answer (one-best-answer format)
- Clinical or applied scenario preferred over pure recall (Applying/Analyzing preferred)
- NO "all of the above" or "none of the above" choices
- NO duplicate choice texts
- Explanation ≥ 3 sentences; cite specific textbook, author, edition, and page
- Source field: book title + author + edition/year + page number (required)
- Use original wording — do not reproduce copyrighted text verbatim
- Notes field: a short mnemonic or high-yield tip (optional but strongly preferred)
- Set sourceType to "ai-draft" and status to "unverified"

Output format (JSON array — all fields required unless marked optional):
[
  {
    "id": "subj-NNNN",
    "year": 3,
    "subject": "Course Name",
    "vmleSubject": "Veterinary Pathology",
    "competencyId": "Veterinary Pathology:A.1.1",
    "bloomLevel": "Ap",
    "stem": "A 5-year-old Labrador presents with...",
    "choices": [
      { "key": "A", "text": "Coagulative necrosis" },
      { "key": "B", "text": "Liquefactive necrosis" },
      { "key": "C", "text": "Caseous necrosis" },
      { "key": "D", "text": "Gangrenous necrosis" }
    ],
    "answer": "B",
    "explanation": "The correct answer is B because... [≥3 sentences, cite page].",
    "sourceType": "ai-draft",
    "source": "Zachary JF. Pathologic Basis of Veterinary Disease, 6th ed., p. 142",
    "status": "unverified",
    "notes": "Mnemonic: Liquefactive = brain, pus (liquid places)"
  }
]
```

---

## ID Naming Convention

Use a short subject prefix + zero-padded 4-digit counter.
Start numbering from the next available ID in `src/data/questions/sample.json` to avoid collisions.

### VMLE subjects

| Subject                                   | Prefix  |
| ----------------------------------------- | ------- |
| Veterinary Anatomy                        | `anat-` |
| Veterinary Physiology                     | `phys-` |
| Zootechnics                               | `zoo-`  |
| Veterinary Pathology                      | `path-` |
| Veterinary Pharmacology                   | `phrm-` |
| Veterinary Medicine                       | `vmed-` |
| Veterinary Microbiology and Public Health | `micro-`|
| Veterinary Parasitology                   | `para-` |
| Veterinary Surgery                        | `surg-` |

### Pre-DVM (Year 0)

| Course                   | Prefix     | Example competencyId          |
| ------------------------ | ---------- | ----------------------------- |
| General Chemistry        | `gchem-`   | `PRE:CHEM-GEN:A.1`            |
| Organic Chemistry        | `ochem-`   | `PRE:CHEM-ORG:C.1`            |
| Biochemistry             | `bio-`     | `PRE:BIOCHEM:B.2`             |
| General Biology/Zoology  | `biol-`    | `PRE:BIO-GEN:D.2`             |
| Biostatistics            | `stat-`    | `PRE:STAT:C.2`                |
| Genetics/Breeding        | `genet-`   | `PRE:GENETICS:D.1`            |
| Animal Production (intro)| `aprod-`   | `PRE:ANIM-PROD:C.1`           |
| Animal Nutrition         | `anutr-`   | `PRE:ANIM-NUTR:A.2`           |
| Physics                  | `phys0-`   | `PRE:PHYSICS:C.2`             |

> For Pre-DVM questions, set `vmleSubject` to the closest VMLE subject
> (e.g. `"Veterinary Physiology"` for Biochemistry; `"Zootechnics"` for Animal Production)
> or omit it and import manually setting any subject as a placeholder.

---

## Bloom Level Reference

| Code | Level         | Action verbs                                   | Use for                       |
| ---- | ------------- | ---------------------------------------------- | ----------------------------- |
| R    | Remembering   | Define, list, recall, name                     | Key terms, normal values      |
| U    | Understanding | Explain, describe, classify, summarize         | Mechanisms, pathophysiology   |
| Ap   | Applying      | Use, solve, calculate, demonstrate             | Clinical scenarios, drug doses|
| An   | Analyzing     | Distinguish, compare, differentiate, diagnose  | DDx, interpret lab results    |
| E    | Evaluating    | Justify, choose, recommend, prioritize         | Treatment decisions           |
| C    | Creating      | Design, construct, formulate                   | (rare in VMLE MCQ)            |

Target distribution per batch: ~20% R, 30% U, 30% Ap, 20% An. Avoid C for MCQ.

---

## Anti-patterns to Avoid

| Anti-pattern                                  | Why                                                    |
| --------------------------------------------- | ------------------------------------------------------ |
| "All of the above" / "None of the above"       | Rejected by the importer; students can guess easily   |
| Duplicate choice texts                        | Rejected by the importer                              |
| Stem > 500 chars                              | Rejected by the importer; use shorter clinical vignette|
| Explanation < 20 chars                        | Rejected; must teach, not just restate                |
| Source < 15 chars (e.g. "textbook p.1")       | Rejected; must include author, title, edition, page   |
| Absolute terms in choices ("always", "never") | Easy to eliminate; use relative language              |
| Negatives in stem ("which is NOT")            | Avoid unless testing a critical safety fact           |

---

## After Generating

1. Copy the JSON output
2. Open the app → **Import** tab
3. Paste the JSON → click **Validate**
4. Fix any errors reported by the importer
5. Click **Import**
6. Check Browse → confirm question counts updated
7. **Wait 24 hours**, then return to Import → Pending Verification to mark each question verified

---

## Verification Workflow (Solo, 24-hour rule)

1. Import questions (all saved as `unverified`).
2. Wait at least 24 hours (reduces confirmation bias from generation session).
3. Open each question's cited source (textbook page, paper, etc.).
4. Verify: stem is clinically accurate, correct answer is unambiguous, distractors are plausible.
5. In the app → Import → Pending Verification, tap **Mark verified** for each confirmed question.
6. Any question you cannot verify: leave as `unverified` or delete it.

> Do not mark questions `verified` during the same session they were generated.
> This is enforced by the app (24-hour lock).
