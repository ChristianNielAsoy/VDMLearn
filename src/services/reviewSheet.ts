import type { CompetencyNote, ClozeCard, MistakeEntry, BlurtSession } from '@/types/notes';
import { parseWikiLinks } from './wikiLinks';

export interface ReviewSheetStats {
  /** Average self-score across all blurt sessions (1–3 scale) */
  avgBlurtScore: number | null;
  /** Number of blurt sessions recorded */
  blurtCount: number;
  /** Most recent blurt session timestamp */
  lastBlurtAt: number | null;
  /** Total mistake entries for this competency's questions */
  mistakeCount: number;
  /** Distribution of mistake reasons */
  mistakeReasons: Record<string, number>;
  /** Number of cloze cards derived from this note */
  clozeCount: number;
}

export interface ReviewSheet {
  competencyId: string;
  note: CompetencyNote;
  stats: ReviewSheetStats;
  wikiLinks: { competencyId: string; displayText: string; resolved: { subject: string; text: string } | null }[];
  clozeCards: ClozeCard[];
}

export function buildReviewSheet(
  note: CompetencyNote,
  clozeCards: ClozeCard[],
  mistakeEntries: MistakeEntry[],
  blurtSessions: BlurtSession[],
): ReviewSheet {
  const stats = computeStats(clozeCards, mistakeEntries, blurtSessions);
  const wikiLinks = parseWikiLinks(note.bodyMd);

  return {
    competencyId: note.competencyId,
    note,
    stats,
    wikiLinks,
    clozeCards,
  };
}

function computeStats(
  clozeCards: ClozeCard[],
  mistakeEntries: MistakeEntry[],
  blurtSessions: BlurtSession[],
): ReviewSheetStats {
  const avgBlurtScore =
    blurtSessions.length > 0
      ? blurtSessions.reduce((s, b) => s + b.selfScore, 0) / blurtSessions.length
      : null;

  const lastBlurtAt =
    blurtSessions.length > 0
      ? Math.max(...blurtSessions.map((b) => b.ts))
      : null;

  const mistakeReasons: Record<string, number> = {};
  for (const e of mistakeEntries) {
    mistakeReasons[e.reason] = (mistakeReasons[e.reason] ?? 0) + 1;
  }

  return {
    avgBlurtScore,
    blurtCount: blurtSessions.length,
    lastBlurtAt,
    mistakeCount: mistakeEntries.length,
    mistakeReasons,
    clozeCount: clozeCards.length,
  };
}

/**
 * Renders a ReviewSheet as a Markdown string for export or copy.
 */
export function exportReviewSheetAsMarkdown(sheet: ReviewSheet): string {
  const lines: string[] = [];

  lines.push(`# Review Sheet: ${sheet.competencyId}`);
  lines.push('');
  lines.push(`*Updated: ${new Date(sheet.note.updatedAt).toLocaleDateString()}*`);
  lines.push('');

  lines.push('## Notes');
  lines.push('');
  lines.push(sheet.note.bodyMd);
  lines.push('');

  if (sheet.clozeCards.length > 0) {
    lines.push('## Cloze Cards');
    lines.push('');
    for (const card of sheet.clozeCards) {
      lines.push(`- **Q:** ${card.front}`);
      lines.push(`  **A:** ${card.back}`);
    }
    lines.push('');
  }

  if (sheet.stats.blurtCount > 0) {
    const avg = sheet.stats.avgBlurtScore?.toFixed(1) ?? '—';
    lines.push('## Blurt Performance');
    lines.push('');
    lines.push(`- Sessions: ${sheet.stats.blurtCount}`);
    lines.push(`- Avg self-score: ${avg}/3`);
    lines.push('');
  }

  if (sheet.stats.mistakeCount > 0) {
    lines.push('## Mistake Summary');
    lines.push('');
    for (const [reason, count] of Object.entries(sheet.stats.mistakeReasons)) {
      lines.push(`- ${reason}: ${count}`);
    }
    lines.push('');
  }

  if (sheet.wikiLinks.length > 0) {
    lines.push('## Linked Competencies');
    lines.push('');
    for (const link of sheet.wikiLinks) {
      const label = link.resolved ? `${link.displayText} — ${link.resolved.text}` : `${link.displayText} [?]`;
      lines.push(`- ${link.competencyId}: ${label}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
