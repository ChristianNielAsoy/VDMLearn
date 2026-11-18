# Content Intake: how to feed VDMLearn

**CORRECTION (2026-11-18):** an earlier version of this file told you to paste OpenStax sections into Claude chat. OpenStax's current terms say its books may not be ingested into large language models or generative AI offerings without written permission, and its license is CC BY-NC-SA 4.0 (older prefaces say CC BY). So: read OpenStax yourself and write notes yourself. Use AI only on text you wrote, on government/legal texts, or on sources whose terms clearly allow it. Check every other publisher's terms before pasting anything.

Principle: the app stores YOUR structured, sourced study content (notes in your own words, questions, cards). It does not store copies of books or slides. Books, PPTs and videos are _sources_; every item you create points back to one with a locator (page, slide, timestamp).
Not legal advice: personal study notes in your own words are the safe lane; risk rises when you copy text or share material you don't have the right to share.

## 1. Source types

| Source                              | Examples                                                                                                                                                                | Use it for                                                                          | Share with friends?                                                                                                                                                                                  |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Open textbooks                      | OpenStax Biology 2e, Concepts of Biology, Anatomy and Physiology (human, concepts only), Microbiology; Chemistry and Introductory Statistics (confirm current editions) | A reading reference you verify against. Do NOT paste into AI tools (OpenStax terms) | Adaptations: attribution, non-commercial, share-alike (CC BY-NC-SA 4.0). Older prefaces say CC BY; check each book's page                                                                            |
| Vet open texts                      | "Veterinary Histology" (listed as openly licensed by a university guide), InTech open-access veterinary books                                                           | Histology, general vet topics                                                       | Check each license                                                                                                                                                                                   |
| WikiVet                             | wiki + learning resources                                                                                                                                               | Read and link out                                                                   | Do not copy: sources conflict (site terms say CC BY 3.0 / BY-SA; another page says BY-NC-ND; a library guide says not openly licensed)                                                               |
| Commercial references               | Merck Veterinary Manual, Plumb's, IMAIOS                                                                                                                                | Link out per competency                                                             | No                                                                                                                                                                                                   |
| Textbooks you own/borrow            | CHED reference list (Dyce, Reece, Cheville, Urquhart, ...)                                                                                                              | Your own-words notes and questions with page locators                               | Notes in your own words: private by default. Never upload scans or paste pages                                                                                                                       |
| School slides/handouts              | professors' PPT/PDF (once enrolled)                                                                                                                                     | Private study; questions and cards in your own words                                | No, unless the professor allows it                                                                                                                                                                   |
| Your own notes                      | typed or handwritten                                                                                                                                                    | Best source                                                                         | Yes                                                                                                                                                                                                  |
| Philippine laws and government docs | RA 9268, Animal Welfare Act, DA/DOH administrative orders, BAI/DA/PCAARRD publications                                                                                  | Ethics and Jurisprudence, Zootechnics (PH context), food safety                     | Official legislative/administrative texts are not copyrightable (IP Code Sec. 175); works of the Government have no copyright (Sec. 176) but profit use needs agency approval. Still cite the source |
| PRC Tables of Specifications        | vmle-tos-2024.json                                                                                                                                                      | Structure only                                                                      | Yes                                                                                                                                                                                                  |
| Videos / lectures                   | YouTube, recorded classes                                                                                                                                               | Your own notes from them                                                            | Link out, don't redistribute                                                                                                                                                                         |

## 2. Source registry (add to the app and to every content pack)

```json
{
  "id": "openstax-bio2e",
  "title": "Biology 2e",
  "type": "open-textbook",
  "license": "CC BY-NC-SA 4.0 (verify on book page)",
  "attribution": "OpenStax, Biology 2e, link",
  "shareable": true,
  "locatorScheme": "chapter.section",
  "url": "https://openstax.org/books/biology-2e"
}
```

Rule: items from a source with `shareable:false` are excluded from exported/shared content packs and from the shared bank.

## 3. Pipeline

1. **Register** the source (above).
2. **Extract text**
   - Text PDFs and ebooks: first check the source's terms on AI use (sources.json `aiIngestion`). If not allowed or unknown, read the section yourself and type your own notes; then use AI on your notes.
   - Slides: export PPT to PDF, or paste slide text. Note slide numbers.
   - Scans and handwritten notes: upload photos or scanned pages; Claude chat can read them.
   - Video: use your own notes or the transcript for private use.
   - Work in chunks of one section or about 10-15 pages, so answers stay accurate and traceable.
3. **Map the chunk to a competency id** (PRC TOS id, or `PRE:...` for Year 0).
4. **Generate** from the pasted text only: lesson notes, MCQs, cloze cards, diagram label lists, worked calculation examples (only if the source has them).
5. **Import** the JSON through the import page; lint rejects bad items; everything lands as `unverified`.
6. **Verify** at least 24 hours later against the cited page; set `verified` with a source.
7. **Check coverage**; pick the next gap; repeat.

## 4. Templates (paste into Claude chat with the text chunk)

### Questions

```
Use ONLY the text below (my own notes, or a source whose terms allow AI use). Do not add facts from memory.
Competency: <id and name>
Source: <sourceId>, <chapter/pages/slides>
Write <N> multiple-choice questions in your own words:
- 4 distinct choices, one best answer, no "all of the above"
- explanation (2-3 sentences) in your own words
- "source": "<sourceId> <exact page/section from the text>"
- "bloom": remember | understand | apply | analyze | evaluate
- Quote nothing longer than 10 words. No drug doses, legal details or numbers unless they appear in the text.
- If the text does not support a good question, skip it and tell me.
Return ONLY a JSON array of objects with fields:
year, vmleSubject, competencyId, stem, choices[{key,text}], answer, explanation, sourceType:"ai-draft", source, bloom
TEXT:
<paste chunk>
```

### Lesson notes

```
Use ONLY the text below. Write lesson notes in your own words: 3-5 objectives, key terms with one-line definitions, a short summary, "high-yield" points, one mnemonic if natural, and 3 self-test questions. Cite the section for every key point. Flag anything unclear. Do not copy sentences.
Competency: <id>  Source: <sourceId> <locator>
TEXT:
<paste chunk>
```

### Cloze cards

```
From the notes below, create <N> cloze cards (one fact each, format "...{{c1::answer}}..."). Use only facts in the notes. Return JSON: [{"text": "...", "competencyId": "...", "source": "..."}].
```

## 5. Quality rules

- Every item needs a competency id and a source locator; no locator = not importable.
- One best answer; plausible distractors; no trick wording; no giveaways in the stem.
- AI output is a draft until verified against the page.
- Doses, withdrawal periods, laws and normal values: verified before use, always.
- Keep a short list of rejected items and why, to improve prompts.

## 6. What to feed first

1. Now (pre-DVM): read OpenStax (Biology 2e, Concepts of Biology, Microbiology, chemistry, statistics) yourself and write your own notes; start from content/pack-001 and verify it against those books. 5 competencies x 20 questions.
2. Year 2 subjects: school slides + textbooks (private).
3. VMLE bank: TOS competencies, textbooks, PH laws and government publications.

## 7. Targets

Pilot: 100 verified Year 0 questions; 20 per VMLE subject. Review the process (time per verified question, rejection rate) before scaling.
