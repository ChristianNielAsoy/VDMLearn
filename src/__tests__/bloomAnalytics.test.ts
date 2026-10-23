import { describe, it, expect } from 'vitest';
import { computeBloomPerformance, BLOOM_LABELS } from '@/services/bloomAnalytics';
import type { BloomLevel, VmleSubject } from '@/types/question';
import type { Question } from '@/types/question';
import type { ReviewEvent } from '@/types/review';

const NOW = 1_720_000_000_000;

function makeQ(id: string, bloom?: BloomLevel, subject: VmleSubject = 'Veterinary Anatomy'): Question {
  const q: Question = {
    id, type: 'question', competencyIds: ['Veterinary Anatomy:A.1'],
    courseRefs: [], links: [], origin: { type: 'ai-draft', ref: 'test' },
    status: 'unverified', updatedAt: 0, version: 1, year: 2,
    subject: 'Gross Anatomy', vmleSubject: subject,
    competencyId: 'Veterinary Anatomy:A.1',
    stem: 'Test stem that is long enough for validation',
    choices: [{ key: 'A', text: 'A' }, { key: 'B', text: 'B' }, { key: 'C', text: 'C' }, { key: 'D', text: 'D' }],
    answer: 'A', explanation: 'A.', sourceType: 'ai-draft', source: 'test',
  };
  if (bloom !== undefined) q.bloomLevel = bloom;
  return q;
}

function makeEvent(objectId: string, correct: boolean): ReviewEvent {
  return {
    objectId, activityType: 'mcq', correct,
    rating: correct ? 3 : 1, confidence: 2, responseMs: 3000,
    mode: 'competency', sessionId: 's1', ts: NOW,
  };
}

const TOS_TARGETS = { R: 10, U: 30, Ap: 20, An: 30, E: 5, C: 5 };

describe('computeBloomPerformance', () => {
  it('returns empty array when no questions have bloomLevel', () => {
    const questions = new Map([['q1', makeQ('q1', undefined)]]);
    const result = computeBloomPerformance([], questions, undefined, TOS_TARGETS);
    expect(result).toHaveLength(0);
  });

  it('returns NaN accuracy when level has questions but no events', () => {
    const questions = new Map([['q1', makeQ('q1', 'R')]]);
    const result = computeBloomPerformance([], questions, undefined, TOS_TARGETS);
    expect(result).toHaveLength(1);
    expect(result[0]!.level).toBe('R');
    expect(result[0]!.attempts).toBe(0);
    expect(Number.isNaN(result[0]!.accuracy)).toBe(true);
  });

  it('computes correct accuracy per level', () => {
    const questions = new Map([
      ['q1', makeQ('q1', 'R')],
      ['q2', makeQ('q2', 'U')],
    ]);
    const events: ReviewEvent[] = [
      makeEvent('q1', true), makeEvent('q1', false), // R: 1/2 = 0.5
      makeEvent('q2', true), makeEvent('q2', true),  // U: 2/2 = 1.0
    ];
    const result = computeBloomPerformance(events, questions, undefined, TOS_TARGETS);
    const r = result.find((x) => x.level === 'R')!;
    const u = result.find((x) => x.level === 'U')!;
    expect(r.attempts).toBe(2);
    expect(r.correct).toBe(1);
    expect(r.accuracy).toBeCloseTo(0.5);
    expect(u.accuracy).toBe(1.0);
  });

  it('result order follows canonical Bloom order (R U Ap An E C)', () => {
    const questions = new Map([
      ['q1', makeQ('q1', 'An')],
      ['q2', makeQ('q2', 'U')],
      ['q3', makeQ('q3', 'R')],
    ]);
    const result = computeBloomPerformance([], questions, undefined, TOS_TARGETS);
    const levels = result.map((x) => x.level);
    expect(levels).toEqual(['R', 'U', 'An']);
  });

  it('filters by subject — ignores questions from other subjects', () => {
    const questions = new Map([
      ['q1', makeQ('q1', 'R', 'Veterinary Anatomy')],
      ['q2', makeQ('q2', 'U', 'Veterinary Physiology')],
    ]);
    const events = [makeEvent('q1', true), makeEvent('q2', false)];
    const result = computeBloomPerformance(events, questions, 'Veterinary Anatomy', TOS_TARGETS);
    expect(result.every((x) => x.level === 'R')).toBe(true);
    expect(result).toHaveLength(1);
    expect(result[0]!.attempts).toBe(1);
    expect(result[0]!.correct).toBe(1);
  });

  it('sets tosTargetPct from the provided targets map', () => {
    const questions = new Map([['q1', makeQ('q1', 'Ap')]]);
    const result = computeBloomPerformance([], questions, undefined, { ...TOS_TARGETS, Ap: 42 });
    expect(result[0]!.tosTargetPct).toBe(42);
  });

  it('BLOOM_LABELS contains a label for every level', () => {
    const levels: BloomLevel[] = ['R', 'U', 'Ap', 'An', 'E', 'C'];
    for (const lvl of levels) {
      expect(BLOOM_LABELS[lvl]).toBeTruthy();
    }
  });
});
