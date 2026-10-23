import { describe, it, expect } from 'vitest';
import type { MistakeReason, MistakeEntry, CompetencyNote, ClozeCard, BlurtSession } from '@/types/notes';

describe('MistakeReason', () => {
  it('covers all four expected values', () => {
    const reasons: MistakeReason[] = ['knowledge-gap', 'misread', 'careless', 'mixed-up'];
    expect(reasons).toHaveLength(4);
  });
});

describe('MistakeEntry', () => {
  it('accepts required fields only (no id, no detail)', () => {
    const e: MistakeEntry = { questionId: 'q1', reason: 'careless', ts: 1000 };
    expect(e.questionId).toBe('q1');
    expect(e.id).toBeUndefined();
    expect(e.detail).toBeUndefined();
  });

  it('round-trips through JSON', () => {
    const e: MistakeEntry = { id: 1, questionId: 'q2', reason: 'misread', ts: 2000, detail: 'confused A and B' };
    const parsed = JSON.parse(JSON.stringify(e)) as MistakeEntry;
    expect(parsed.detail).toBe('confused A and B');
  });
});

describe('CompetencyNote', () => {
  it('round-trips through JSON', () => {
    const n: CompetencyNote = { competencyId: 'Veterinary Anatomy:A.1', bodyMd: '# note', updatedAt: 3000 };
    const parsed = JSON.parse(JSON.stringify(n)) as CompetencyNote;
    expect(parsed.bodyMd).toBe('# note');
  });
});

describe('ClozeCard', () => {
  it('source is note-highlight or manual', () => {
    const sources: ClozeCard['source'][] = ['note-highlight', 'manual'];
    expect(sources).toHaveLength(2);
  });

  it('accepts card without id', () => {
    const c: ClozeCard = { competencyId: 'Veterinary Anatomy:A.1', front: 'The _____ is the longest bone.', back: 'The femur is the longest bone.', source: 'note-highlight', createdAt: 4000 };
    expect(c.id).toBeUndefined();
  });
});

describe('BlurtSession', () => {
  it('selfScore is 1, 2, or 3', () => {
    const scores: BlurtSession['selfScore'][] = [1, 2, 3];
    expect(scores).toHaveLength(3);
  });
});
