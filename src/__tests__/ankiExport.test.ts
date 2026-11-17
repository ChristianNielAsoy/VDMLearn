import { describe, it, expect } from 'vitest';
import { questionsToAnkiTsv } from '@/services/ankiExport';
import type { Question } from '@/types/question';

const makeQ = (overrides: Partial<Question> = {}): Question => ({
  type: 'question',
  id: 'test-001',
  year: 3,
  subject: 'General Physiology',
  vmleSubject: 'Veterinary Physiology',
  competencyId: 'Veterinary Physiology:A.1',
  competencyIds: ['Veterinary Physiology:A.1'],
  courseRefs: [],
  links: [],
  origin: { type: 'own-notes', ref: 'Test ref' },
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
  explanation: 'The resting membrane potential is approximately -70 mV due to K+ leak channels.',
  sourceType: 'own-notes',
  source: 'Test',
  status: 'verified',
  ...overrides,
});

describe('questionsToAnkiTsv', () => {
  it('includes Anki header lines', () => {
    const tsv = questionsToAnkiTsv([makeQ()]);
    expect(tsv).toContain('#separator:tab');
    expect(tsv).toContain('#html:true');
    expect(tsv).toContain('#tags column:3');
  });

  it('produces one data row per question', () => {
    const tsv = questionsToAnkiTsv([makeQ(), makeQ({ id: 'test-002' })]);
    const dataRows = tsv.split('\n').filter((l) => !l.startsWith('#') && l.trim());
    expect(dataRows).toHaveLength(2);
  });

  it('front field contains the stem', () => {
    const tsv = questionsToAnkiTsv([makeQ()]);
    const dataRow = tsv.split('\n').find((l) => !l.startsWith('#') && l.trim())!;
    const [front] = dataRow.split('\t');
    expect(front).toContain('resting membrane potential');
  });

  it('front field contains all four choices', () => {
    const tsv = questionsToAnkiTsv([makeQ()]);
    const dataRow = tsv.split('\n').find((l) => !l.startsWith('#') && l.trim())!;
    const [front] = dataRow.split('\t');
    expect(front).toContain('A. -70 mV');
    expect(front).toContain('B. -90 mV');
    expect(front).toContain('C. +40 mV');
    expect(front).toContain('D. 0 mV');
  });

  it('back field contains the answer key', () => {
    const tsv = questionsToAnkiTsv([makeQ()]);
    const dataRow = tsv.split('\n').find((l) => !l.startsWith('#') && l.trim())!;
    const [, back] = dataRow.split('\t');
    expect(back).toContain('Answer: A');
  });

  it('back field contains the explanation', () => {
    const tsv = questionsToAnkiTsv([makeQ()]);
    const dataRow = tsv.split('\n').find((l) => !l.startsWith('#') && l.trim())!;
    const [, back] = dataRow.split('\t');
    expect(back).toContain('K+ leak channels');
  });

  it('tags field contains dvmreview tag and subject tag', () => {
    const tsv = questionsToAnkiTsv([makeQ()]);
    const dataRow = tsv.split('\n').find((l) => !l.startsWith('#') && l.trim())!;
    const parts = dataRow.split('\t');
    expect(parts).toHaveLength(3);
    const tags = parts[2]!;
    expect(tags).toContain('dvmreview');
    expect(tags).toContain('Veterinary_Physiology');
  });

  it('escapes HTML special characters in stem', () => {
    const q = makeQ({ stem: 'Which cell type > others in <function>?' });
    const tsv = questionsToAnkiTsv([q]);
    const dataRow = tsv.split('\n').find((l) => !l.startsWith('#') && l.trim())!;
    const [front] = dataRow.split('\t');
    expect(front).toContain('&gt;');
    expect(front).toContain('&lt;');
    expect(front).not.toContain('> others');
  });

  it('produces empty string body (only headers) for empty input', () => {
    const tsv = questionsToAnkiTsv([]);
    const dataRows = tsv.split('\n').filter((l) => !l.startsWith('#') && l.trim());
    expect(dataRows).toHaveLength(0);
  });

  it('each row has exactly 3 tab-separated fields', () => {
    const tsv = questionsToAnkiTsv([makeQ(), makeQ({ id: 'q2' })]);
    const dataRows = tsv.split('\n').filter((l) => !l.startsWith('#') && l.trim());
    for (const row of dataRows) {
      const fields = row.split('\t');
      expect(fields).toHaveLength(3);
    }
  });
});
