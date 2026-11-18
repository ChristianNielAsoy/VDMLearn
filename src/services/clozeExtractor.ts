import type { ClozeCard } from '@/types/notes';

// Matches ==highlighted text== (non-greedy, no newlines inside)
const HIGHLIGHT_RE = /==([^=\n]+)==/g;

export interface ExtractedCloze {
  /** Original full sentence containing the highlight */
  sentence: string;
  /** Highlighted span that becomes the blank */
  highlight: string;
  /** Cloze front: sentence with highlight replaced by _____ */
  front: string;
  /** Cloze back: original sentence with the answer in context */
  back: string;
}

/**
 * Extracts cloze pairs from a markdown body using ==highlight== syntax.
 * Each highlight becomes one cloze card. If a highlight spans multiple sentences,
 * the whole paragraph line is used as context.
 */
export function extractClozeFromMarkdown(bodyMd: string): ExtractedCloze[] {
  const results: ExtractedCloze[] = [];
  const lines = bodyMd.split('\n');

  for (const line of lines) {
    // Skip headings, horizontal rules, and empty lines
    if (/^#{1,6}\s/.test(line) || /^---+$/.test(line) || line.trim() === '') continue;

    HIGHLIGHT_RE.lastIndex = 0;
    if (!HIGHLIGHT_RE.test(line)) continue;

    // Find all highlights in this line
    HIGHLIGHT_RE.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = HIGHLIGHT_RE.exec(line)) !== null) {
      const highlight = match[1]!;
      // Use the line itself as back (stripped of markdown formatting)
      const back = line
        .replace(/==([^=\n]+)==/g, '$1')
        .replace(/[*_`]/g, '')
        .trim();
      const front = back.replace(highlight, '_____');
      results.push({ sentence: back, highlight, front, back });
    }
  }

  return results;
}

/**
 * Converts ExtractedCloze items into ClozeCard objects ready for DB insertion.
 */
export function toClozeCards(
  extracts: ExtractedCloze[],
  competencyId: string,
  source: ClozeCard['source'] = 'note-highlight',
  now = Date.now(),
): Omit<ClozeCard, 'id'>[] {
  return extracts.map((e) => ({
    competencyId,
    front: e.front,
    back: e.back,
    source,
    createdAt: now,
  }));
}

/**
 * Convenience: extract from markdown and convert to ClozeCard objects in one call.
 */
export function extractAndConvert(
  bodyMd: string,
  competencyId: string,
  now = Date.now(),
): Omit<ClozeCard, 'id'>[] {
  return toClozeCards(extractClozeFromMarkdown(bodyMd), competencyId, 'note-highlight', now);
}
