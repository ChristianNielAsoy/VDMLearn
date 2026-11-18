import { describe, it, expect } from 'vitest';
import { parseAnkiTsv, ankiRowsToQuestions } from '@/services/ankiImport';
import { questionsToAnkiTsv } from '@/services/ankiExport';
import type { Question } from '@/types/question';

const makeQ = (): Question => ({
  type: 'question',
  id: 'rt-001',
  year: 3,
  subject: 'General Physiology',
  vmleSubject: 'Veterinary Physiology',
  competencyId: 'Veterinary Physiology:A.1',
  competencyIds: ['Veterinary Physiology:A.1'],
  courseRefs: [],
  links: [],
  origin: { type: 'own-notes', ref: 'Test' },
  updatedAt: 0,
  version: 1,
  stem: 'What is the resting membrane potential of a neuron?',
  choices: [
    { key: 'A', text: '-70 mV' },
    { key: 'B', text: '-90 mV' },
    { key: 'C', text: '+40 mV' },
    { key: 'D', text: '0 mV' },
  ],
  answer: 'A',
  explanation: 'The resting membrane potential is approximately -70 mV.',
  sourceType: 'own-notes',
  source: 'Test',
  status: 'verified',
});

describe('parseAnkiTsv', () => {
  it('skips comment lines starting with #', () => {
    const tsv = '#separator:tab\n#html:true\nFront\tBack\ttag1';
    const result = parseAnkiTsv(tsv);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]?.front).toBe('Front');
  });

  it('skips blank lines', () => {
    const tsv = 'F1\tB1\t\n\nF2\tB2\ttag';
    const result = parseAnkiTsv(tsv);
    expect(result.rows).toHaveLength(2);
  });

  it('skips rows with fewer than 2 fields', () => {
    const tsv = 'OnlyOneField\nFront\tBack';
    const result = parseAnkiTsv(tsv);
    expect(result.rows).toHaveLength(1);
    expect(result.skipped).toBe(1);
  });

  it('parses tags into an array', () => {
    const tsv = 'F\tB\ttag1 tag2 tag3';
    const result = parseAnkiTsv(tsv);
    expect(result.rows[0]?.tags).toEqual(['tag1', 'tag2', 'tag3']);
  });

  it('handles rows without a tags column', () => {
    const tsv = 'Front\tBack';
    const result = parseAnkiTsv(tsv);
    expect(result.rows[0]?.tags).toEqual([]);
  });

  it('reports errors when no rows found', () => {
    const result = parseAnkiTsv('#separator:tab\n# only comments');
    expect(result.rows).toHaveLength(0);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe('ankiRowsToQuestions', () => {
  it('creates one question per row', () => {
    const rows = [
      { front: 'Q1', back: 'A1', tags: [] },
      { front: 'Q2', back: 'A2', tags: [] },
    ];
    const qs = ankiRowsToQuestions(rows);
    expect(qs).toHaveLength(2);
  });

  it('sets status to unverified', () => {
    const qs = ankiRowsToQuestions([{ front: 'Q', back: 'A', tags: [] }]);
    expect(qs[0]?.status).toBe('unverified');
  });

  it('sets sourceType to imported', () => {
    const qs = ankiRowsToQuestions([{ front: 'Q', back: 'A', tags: [] }]);
    expect(qs[0]?.sourceType).toBe('imported');
  });

  it('uses front as stem when no structured choices', () => {
    const qs = ankiRowsToQuestions([
      { front: 'Simple question text', back: 'Answer text', tags: [] },
    ]);
    expect(qs[0]?.stem).toBe('Simple question text');
  });

  it('extracts vmleSubject from tag if recognisable', () => {
    const qs = ankiRowsToQuestions([
      { front: 'Q', back: 'A', tags: ['dvmreview', 'Veterinary_Physiology'] },
    ]);
    expect(qs[0]?.vmleSubject).toBe('Veterinary Physiology');
  });
});

describe('round-trip: export then import', () => {
  it('recovers stem from exported front field', () => {
    const original = makeQ();
    const tsv = questionsToAnkiTsv([original]);
    const { rows } = parseAnkiTsv(tsv);
    expect(rows).toHaveLength(1);
    const qs = ankiRowsToQuestions(rows);
    expect(qs[0]?.stem).toBe(original.stem);
  });

  it('recovers all 4 choice texts', () => {
    const original = makeQ();
    const tsv = questionsToAnkiTsv([original]);
    const { rows } = parseAnkiTsv(tsv);
    const qs = ankiRowsToQuestions(rows);
    const choiceTexts = qs[0]?.choices.map((c) => c.text) ?? [];
    expect(choiceTexts).toContain('-70 mV');
    expect(choiceTexts).toContain('-90 mV');
    expect(choiceTexts).toContain('+40 mV');
    expect(choiceTexts).toContain('0 mV');
  });

  it('recovers the answer key', () => {
    const original = makeQ();
    const tsv = questionsToAnkiTsv([original]);
    const { rows } = parseAnkiTsv(tsv);
    const qs = ankiRowsToQuestions(rows);
    expect(qs[0]?.answer).toBe('A');
  });

  it('recovers the explanation', () => {
    const original = makeQ();
    const tsv = questionsToAnkiTsv([original]);
    const { rows } = parseAnkiTsv(tsv);
    const qs = ankiRowsToQuestions(rows);
    expect(qs[0]?.explanation).toContain('-70 mV');
  });

  it('recovers vmleSubject from tags', () => {
    const original = makeQ();
    const tsv = questionsToAnkiTsv([original]);
    const { rows } = parseAnkiTsv(tsv);
    const qs = ankiRowsToQuestions(rows);
    expect(qs[0]?.vmleSubject).toBe('Veterinary Physiology');
  });
});
