import type { CompetencyNote } from '@/types/notes';

function formatDate(ts: number): string {
  return new Date(ts).toISOString().slice(0, 10);
}

function headingFromId(id: string): string {
  // "Veterinary Anatomy:A.1" → "Veterinary Anatomy — A.1"
  return id.replace(':', ' — ');
}

/**
 * Convert an array of competency notes to a single Markdown document.
 * Notes are sorted by competencyId (subject then section).
 */
export function notesToMarkdown(notes: CompetencyNote[]): string {
  if (notes.length === 0) {
    return '# DVM Reviewer — Competency Notes\n\n_(No notes exported.)_\n';
  }

  const sorted = [...notes].sort((a, b) => a.competencyId.localeCompare(b.competencyId));

  const exportedAt = formatDate(Date.now());
  const sections: string[] = [
    `# DVM Reviewer — Competency Notes`,
    ``,
    `Exported: ${exportedAt} · ${sorted.length} note${sorted.length !== 1 ? 's' : ''}`,
    ``,
    `---`,
    ``,
  ];

  for (const note of sorted) {
    const heading = headingFromId(note.competencyId);
    const updated = formatDate(note.updatedAt);
    sections.push(`## ${heading}`);
    sections.push(``);
    sections.push(`_Last updated: ${updated}_`);
    sections.push(``);
    sections.push(note.bodyMd.trim());
    sections.push(``);
    sections.push(`---`);
    sections.push(``);
  }

  return sections.join('\n');
}

export function downloadNotesMarkdown(notes: CompetencyNote[]): void {
  const md = notesToMarkdown(notes);
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `dvmreview-notes-${new Date().toISOString().slice(0, 10)}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
