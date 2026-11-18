import type { Question, ChoiceKey, VmleSubject } from '@/types/question';

/** Strip HTML tags and decode basic entities from a string. */
function stripHtml(s: string): string {
  return s
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .trim();
}

function normalizeVmleSubject(raw: string): VmleSubject | undefined {
  const map: Record<string, VmleSubject> = {
    veterinary_anatomy: 'Veterinary Anatomy',
    veterinary_physiology: 'Veterinary Physiology',
    zootechnics: 'Zootechnics',
    veterinary_pathology: 'Veterinary Pathology',
    veterinary_pharmacology: 'Veterinary Pharmacology',
    veterinary_medicine: 'Veterinary Medicine',
    veterinary_microbiology_and_public_health: 'Veterinary Microbiology and Public Health',
    veterinary_parasitology: 'Veterinary Parasitology',
    veterinary_surgery: 'Veterinary Surgery',
  };
  const key = raw.toLowerCase().replace(/\s+/g, '_');
  return map[key];
}

export interface AnkiImportRow {
  front: string;
  back: string;
  tags: string[];
}

export interface AnkiParseResult {
  rows: AnkiImportRow[];
  skipped: number;
  errors: string[];
}

export interface AnkiImportQuestion extends Omit<
  Question,
  'type' | 'competencyIds' | 'courseRefs' | 'links' | 'origin' | 'updatedAt' | 'version'
> {
  type: 'question';
  competencyIds: string[];
  courseRefs: [];
  links: [];
  origin: { type: 'imported'; ref: string };
  updatedAt: 0;
  version: 1;
}

/** Parse raw Anki TSV text into rows. */
export function parseAnkiTsv(text: string): AnkiParseResult {
  const lines = text.split('\n');
  const rows: AnkiImportRow[] = [];
  let skipped = 0;
  const errors: string[] = [];

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const parts = line.split('\t');
    if (parts.length < 2) {
      skipped++;
      continue;
    }
    const [front, back, tagStr] = parts;
    if (!front || !back) {
      skipped++;
      continue;
    }
    const tags = tagStr ? tagStr.split(' ').filter(Boolean) : [];
    rows.push({ front, back, tags });
  }

  if (rows.length === 0 && errors.length === 0 && skipped === 0) {
    errors.push('No valid rows found in the file');
  }

  return { rows, skipped, errors };
}

/**
 * Try to parse a structured front field (from our own export) into stem + 4 choices.
 * Returns null if the structured pattern is not recognised.
 */
function parseStructuredFront(plain: string): {
  stem: string;
  choices: Question['choices'];
} | null {
  const lines = plain
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  // Find indices of A./B./C./D. lines
  const choiceIndices: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (/^[ABCD]\.\s/.test(lines[i]!)) choiceIndices.push(i);
  }

  if (choiceIndices.length < 2) return null;

  const firstChoice = choiceIndices[0]!;
  const stemLines = lines.slice(0, firstChoice);
  const stem = stemLines.join(' ').trim();
  if (!stem) return null;

  const choices: Question['choices'] = [];
  for (let i = 0; i < choiceIndices.length; i++) {
    const start = choiceIndices[i]!;
    const end = i + 1 < choiceIndices.length ? choiceIndices[i + 1]! : lines.length;
    const choiceLines = lines.slice(start, end);
    const keyMatch = /^([ABCD])\.\s+(.*)/.exec(choiceLines[0]!);
    if (keyMatch) {
      const key = keyMatch[1] as ChoiceKey;
      const text = [keyMatch[2], ...choiceLines.slice(1)].join(' ').trim();
      choices.push({ key, text });
    }
  }

  if (choices.length < 2) return null;
  return { stem, choices };
}

/**
 * Try to extract the answer key from the back field (from our own export).
 * Looks for `Answer: X.` or `Answer: X` at the start of the text.
 */
function parseAnswer(plain: string): { answer: ChoiceKey; explanation: string } | null {
  const match = /^Answer:\s*([ABCD])\.?\s*(.*)/is.exec(plain.trim());
  if (!match) return null;
  const answer = match[1] as ChoiceKey;
  const rest = (match[2] ?? '').trim();
  // Skip the answer-text line; explanation starts after the first blank line
  const lines = rest.split('\n');
  const blankIdx = lines.findIndex((l) => l.trim() === '');
  const explanation =
    blankIdx >= 0
      ? lines
          .slice(blankIdx + 1)
          .join('\n')
          .trim()
      : rest;
  return { answer, explanation };
}

/** Convert parsed Anki rows into Question stubs ready for the import page. */
export function ankiRowsToQuestions(rows: AnkiImportRow[]): AnkiImportQuestion[] {
  return rows.map((row, i) => {
    const plainFront = stripHtml(row.front);
    const plainBack = stripHtml(row.back);

    // Try structured parse (round-trip from our own export)
    const structured = parseStructuredFront(plainFront);
    const answerParsed = parseAnswer(plainBack);

    const stem = structured?.stem ?? plainFront.split('\n')[0]?.trim() ?? plainFront;
    const choices: Question['choices'] = structured?.choices ?? [
      { key: 'A', text: 'See answer card' },
      { key: 'B', text: '(placeholder)' },
      { key: 'C', text: '(placeholder)' },
      { key: 'D', text: '(placeholder)' },
    ];
    const answer: ChoiceKey = answerParsed?.answer ?? 'A';
    const explanation = answerParsed?.explanation ?? plainBack;

    // Try to get vmleSubject from tags
    const subjectTag = row.tags.find((t) => normalizeVmleSubject(t));
    const vmleSubject: VmleSubject =
      (subjectTag ? normalizeVmleSubject(subjectTag) : undefined) ?? 'Veterinary Medicine';

    // Try to get competencyId from tags (looks like Subject_A_1 → Subject:A.1)
    const compTag = row.tags.find((t) => /^[A-Za-z_]+_[A-Z]_\d/.test(t));
    const competencyId = compTag
      ? compTag.replace(/_([A-Z]_)/, ':$1').replace(/_/g, '.')
      : `${vmleSubject}:A.1`;

    const id = `anki-import-${Date.now()}-${i}`;

    const q: AnkiImportQuestion = {
      type: 'question',
      id,
      year: 0,
      subject: vmleSubject,
      vmleSubject,
      competencyId,
      competencyIds: [competencyId],
      courseRefs: [],
      links: [],
      origin: { type: 'imported', ref: 'Anki CSV import' },
      updatedAt: 0,
      version: 1,
      stem,
      choices,
      answer,
      explanation,
      sourceType: 'imported',
      source: 'Anki CSV import',
      status: 'unverified',
    };
    return q;
  });
}
