import { describe, it, expect } from 'vitest';
import { buildReviewSheet, exportReviewSheetAsMarkdown } from '@/services/reviewSheet';
import type { CompetencyNote, ClozeCard, MistakeEntry, BlurtSession } from '@/types/notes';

const NOTE: CompetencyNote = {
  competencyId: 'Veterinary Anatomy:A.1',
  bodyMd: '# Osteology\nThe ==femur== is the longest bone.',
  updatedAt: 5000,
};

const CLOZE_CARDS: ClozeCard[] = [
  {
    id: 1,
    competencyId: 'Veterinary Anatomy:A.1',
    front: 'The _____ is the longest bone.',
    back: 'The femur is the longest bone.',
    source: 'note-highlight',
    createdAt: 1000,
  },
];

const MISTAKE_ENTRIES: MistakeEntry[] = [
  { id: 1, questionId: 'q1', reason: 'careless', ts: 1000 },
  { id: 2, questionId: 'q2', reason: 'knowledge-gap', ts: 2000 },
  { id: 3, questionId: 'q3', reason: 'careless', ts: 3000 },
];

const BLURT_SESSIONS: BlurtSession[] = [
  { id: 1, competencyId: 'Veterinary Anatomy:A.1', selfScore: 2, ts: 1000 },
  { id: 2, competencyId: 'Veterinary Anatomy:A.1', selfScore: 3, ts: 4000 },
];

describe('buildReviewSheet', () => {
  it('includes the note and competencyId', () => {
    const sheet = buildReviewSheet(NOTE, CLOZE_CARDS, MISTAKE_ENTRIES, BLURT_SESSIONS);
    expect(sheet.competencyId).toBe('Veterinary Anatomy:A.1');
    expect(sheet.note).toBe(NOTE);
  });

  it('includes cloze cards', () => {
    const sheet = buildReviewSheet(NOTE, CLOZE_CARDS, MISTAKE_ENTRIES, BLURT_SESSIONS);
    expect(sheet.clozeCards).toHaveLength(1);
  });

  it('computes correct blurt stats', () => {
    const sheet = buildReviewSheet(NOTE, CLOZE_CARDS, MISTAKE_ENTRIES, BLURT_SESSIONS);
    expect(sheet.stats.blurtCount).toBe(2);
    expect(sheet.stats.avgBlurtScore).toBeCloseTo(2.5);
    expect(sheet.stats.lastBlurtAt).toBe(4000);
  });

  it('computes correct mistake stats', () => {
    const sheet = buildReviewSheet(NOTE, CLOZE_CARDS, MISTAKE_ENTRIES, BLURT_SESSIONS);
    expect(sheet.stats.mistakeCount).toBe(3);
    expect(sheet.stats.mistakeReasons['careless']).toBe(2);
    expect(sheet.stats.mistakeReasons['knowledge-gap']).toBe(1);
  });

  it('avgBlurtScore is null when no blurt sessions', () => {
    const sheet = buildReviewSheet(NOTE, [], [], []);
    expect(sheet.stats.avgBlurtScore).toBeNull();
    expect(sheet.stats.lastBlurtAt).toBeNull();
  });

  it('mistakeReasons is empty object when no mistakes', () => {
    const sheet = buildReviewSheet(NOTE, [], [], []);
    expect(Object.keys(sheet.stats.mistakeReasons)).toHaveLength(0);
  });

  it('parses wiki links from note body', () => {
    const noteWithLink: CompetencyNote = {
      competencyId: 'Veterinary Anatomy:A.2',
      bodyMd: 'Related: [[Veterinary Anatomy:A.1]]',
      updatedAt: 1000,
    };
    const sheet = buildReviewSheet(noteWithLink, [], [], []);
    expect(sheet.wikiLinks).toHaveLength(1);
    expect(sheet.wikiLinks[0]?.competencyId).toBe('Veterinary Anatomy:A.1');
  });
});

describe('exportReviewSheetAsMarkdown', () => {
  it('includes the competency id in the heading', () => {
    const sheet = buildReviewSheet(NOTE, CLOZE_CARDS, MISTAKE_ENTRIES, BLURT_SESSIONS);
    const md = exportReviewSheetAsMarkdown(sheet);
    expect(md).toContain('Veterinary Anatomy:A.1');
    expect(md).toContain('# Review Sheet');
  });

  it('includes note body', () => {
    const sheet = buildReviewSheet(NOTE, CLOZE_CARDS, MISTAKE_ENTRIES, BLURT_SESSIONS);
    const md = exportReviewSheetAsMarkdown(sheet);
    expect(md).toContain('# Osteology');
  });

  it('includes cloze cards section when cards exist', () => {
    const sheet = buildReviewSheet(NOTE, CLOZE_CARDS, MISTAKE_ENTRIES, BLURT_SESSIONS);
    const md = exportReviewSheetAsMarkdown(sheet);
    expect(md).toContain('Cloze Cards');
    expect(md).toContain('_____');
  });

  it('omits cloze section when no cards', () => {
    const sheet = buildReviewSheet(NOTE, [], MISTAKE_ENTRIES, BLURT_SESSIONS);
    const md = exportReviewSheetAsMarkdown(sheet);
    expect(md).not.toContain('Cloze Cards');
  });

  it('includes blurt performance section when sessions exist', () => {
    const sheet = buildReviewSheet(NOTE, CLOZE_CARDS, MISTAKE_ENTRIES, BLURT_SESSIONS);
    const md = exportReviewSheetAsMarkdown(sheet);
    expect(md).toContain('Blurt Performance');
    expect(md).toContain('2.5');
  });

  it('includes mistake summary section when mistakes exist', () => {
    const sheet = buildReviewSheet(NOTE, CLOZE_CARDS, MISTAKE_ENTRIES, BLURT_SESSIONS);
    const md = exportReviewSheetAsMarkdown(sheet);
    expect(md).toContain('Mistake Summary');
    expect(md).toContain('careless');
  });
});
