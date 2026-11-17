import { describe, it, expect } from 'vitest';
import { notesToMarkdown } from '@/services/notesExport';
import type { CompetencyNote } from '@/types/notes';

const note = (competencyId: string, bodyMd: string, updatedAt = 1700000000000): CompetencyNote => ({
  competencyId,
  bodyMd,
  updatedAt,
});

describe('notesToMarkdown', () => {
  it('returns a placeholder message for empty notes', () => {
    const md = notesToMarkdown([]);
    expect(md).toContain('No notes exported');
  });

  it('includes a top-level heading', () => {
    const md = notesToMarkdown([note('Veterinary Anatomy:A.1', 'Body text')]);
    expect(md).toContain('# DVM Reviewer — Competency Notes');
  });

  it('includes a section heading per note', () => {
    const md = notesToMarkdown([note('Veterinary Anatomy:A.1', 'Body text')]);
    expect(md).toContain('## Veterinary Anatomy — A.1');
  });

  it('includes the note body', () => {
    const md = notesToMarkdown([note('Veterinary Anatomy:A.1', 'My mnemonic: **SOAP**')]);
    expect(md).toContain('My mnemonic: **SOAP**');
  });

  it('sorts notes by competencyId', () => {
    const notes = [
      note('Veterinary Physiology:B.1', 'Second'),
      note('Veterinary Anatomy:A.1', 'First'),
    ];
    const md = notesToMarkdown(notes);
    const aPos = md.indexOf('Veterinary Anatomy');
    const bPos = md.indexOf('Veterinary Physiology');
    expect(aPos).toBeLessThan(bPos);
  });

  it('separates sections with horizontal rules', () => {
    const notes = [
      note('Veterinary Anatomy:A.1', 'First'),
      note('Veterinary Anatomy:B.1', 'Second'),
    ];
    const md = notesToMarkdown(notes);
    expect(md.split('---').length).toBeGreaterThanOrEqual(3); // opener + per note + possible trailing
  });

  it('includes exportedAt date in the header', () => {
    const md = notesToMarkdown([note('X:A', 'body')]);
    // Date should be in YYYY-MM-DD format somewhere in the header
    expect(md).toMatch(/Exported: \d{4}-\d{2}-\d{2}/);
  });

  it('shows last-updated date per note', () => {
    const md = notesToMarkdown([note('Vet:A.1', 'body', new Date('2026-01-15').getTime())]);
    expect(md).toContain('2026-01-15');
  });

  it('handles notes with multi-line bodies', () => {
    const body = '## Heading\n\n- Item 1\n- Item 2\n\nParagraph text.';
    const md = notesToMarkdown([note('X:A', body)]);
    expect(md).toContain('## Heading');
    expect(md).toContain('- Item 1');
    expect(md).toContain('Paragraph text.');
  });
});
