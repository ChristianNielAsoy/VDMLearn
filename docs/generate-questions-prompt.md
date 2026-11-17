# Question Generation Prompt Template

Use this in Claude (chat or Claude Code) to generate questions for the import page.
Copy the output JSON, paste it into `/import`, validate, and import.

## Prompt Template

```
Generate [N] MCQ questions for the VMLE topic below. Output ONLY a valid JSON array — no prose, no markdown fences.

Topic: [paste topic text from vmle-tos-2024.json, e.g., "Gross anatomy of the musculoskeletal system"]
Subject: [one of the 9 VMLE subjects, e.g., "Veterinary Anatomy"]
Competency ID: [from vmle-tos-2024.json format: "SubjectName:SectionId.TopicId", e.g., "Veterinary Anatomy:A.1.1"]
Year: [DVM year the course is taken, 0–6; 0 = Pre-DVM]
Course: [course name as it appears in the curriculum, e.g., "Gross Anatomy"]
School (optional): [UPLB | CLSU | PSAU | CHED — omit for generic]

Requirements:
- Exactly 4 choices (A, B, C, D), one correct
- Clinical or applied scenario preferred over pure recall
- Explanation ≥2 sentences; cite a specific textbook, author, edition, and page
- Source field must include book title, author, edition/year, and page number
- Use original wording — do not reproduce copyrighted text verbatim
- Include a "notes" field with a short mnemonic or high-yield tip (optional but preferred)
- Set sourceType to "ai-draft" and status to "unverified"

Output format (JSON array, all fields required unless marked optional):
[
  {
    "id": "subj-NNNN",
    "year": 3,
    "subject": "Course Name",
    "vmleSubject": "Veterinary Pathology",
    "competencyId": "Veterinary Pathology:A.1.1",
    "stem": "A 5-year-old Labrador presents with...",
    "choices": [
      { "key": "A", "text": "..." },
      { "key": "B", "text": "..." },
      { "key": "C", "text": "..." },
      { "key": "D", "text": "..." }
    ],
    "answer": "B",
    "explanation": "The correct answer is B because...",
    "sourceType": "ai-draft",
    "source": "Zachary JF. Pathologic Basis of Veterinary Disease, 6th ed., p. 142",
    "status": "unverified",
    "notes": "Mnemonic: ..."
  }
]
```

## ID Naming Convention

Use a short subject prefix + zero-padded 4-digit counter:

| Subject                                   | Prefix |
| ----------------------------------------- | ------ |
| Veterinary Anatomy                        | anat-  |
| Veterinary Physiology                     | phys-  |
| Zootechnics                               | zoo-   |
| Veterinary Pathology                      | path-  |
| Veterinary Pharmacology                   | phrm-  |
| Veterinary Medicine                       | vmed-  |
| Veterinary Microbiology and Public Health | micro- |
| Veterinary Parasitology                   | para-  |
| Veterinary Surgery                        | surg-  |

Start numbering from the next available ID in `src/data/questions/sample.json` to avoid collisions.

## After Generating

1. Copy the JSON output
2. Open the app → click the upload icon (⬆) in the header
3. Paste the JSON → click **Validate**
4. Fix any errors reported
5. Click **Import**
6. Browse → confirm question counts updated

## Source Verification Reminder

AI-generated content must be verified against the cited source before being considered reliable.
Set `status: "verified"` only after cross-checking each question against the printed textbook page.
