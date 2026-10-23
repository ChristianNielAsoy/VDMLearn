import { describe, it, expect } from 'vitest';
import { buildSession, ITEMS_PER_DURATION, AVG_SECONDS_PER_ITEM } from '@/services/sessionBuilder';
import type { ScoredItem } from '@/services/itemPriority';
import type { Question } from '@/types/question';

function makeQ(id: string, subject: Question['vmleSubject'] = 'Veterinary Anatomy'): Question {
  return {
    id, type: 'question', competencyIds: ['Veterinary Anatomy:A.1'],
    courseRefs: [], links: [], origin: { type: 'ai-draft', ref: 'test' },
    status: 'unverified', updatedAt: 0, version: 1, year: 2,
    subject: 'Gross Anatomy', vmleSubject: subject,
    competencyId: 'Veterinary Anatomy:A.1',
    stem: 'Test stem that is long enough for validation',
    choices: [{ key: 'A', text: 'A' }, { key: 'B', text: 'B' }, { key: 'C', text: 'C' }, { key: 'D', text: 'D' }],
    answer: 'A', explanation: 'A.', sourceType: 'ai-draft', source: 'test',
  };
}

function makeScored(
  id: string,
  opts: { isNew?: boolean; isOverdue?: boolean; isWeak?: boolean; score?: number } = {},
): ScoredItem {
  return {
    question: makeQ(id),
    score: opts.score ?? 10,
    isNew: opts.isNew ?? false,
    isOverdue: opts.isOverdue ?? false,
    isWeak: opts.isWeak ?? false,
    isLeech: false,
  };
}

describe('ITEMS_PER_DURATION', () => {
  it('maps 10 min → 20, 20 min → 40, 45 min → 90', () => {
    expect(ITEMS_PER_DURATION[10]).toBe(20);
    expect(ITEMS_PER_DURATION[20]).toBe(40);
    expect(ITEMS_PER_DURATION[45]).toBe(90);
  });
});

describe('buildSession', () => {
  it('returns empty plan for empty pool', () => {
    const plan = buildSession({ durationMinutes: 20 }, []);
    expect(plan.questions).toHaveLength(0);
    expect(plan.dueCount).toBe(0);
    expect(plan.newCount).toBe(0);
  });

  it('caps output at targetCount for duration', () => {
    const items = Array.from({ length: 60 }, (_, i) => makeScored(`q${i}`, { isOverdue: true }));
    const plan = buildSession({ durationMinutes: 20 }, items);
    expect(plan.questions).toHaveLength(40);
  });

  it('estimatedMinutes = questions * AVG_SECONDS / 60', () => {
    const items = Array.from({ length: 10 }, (_, i) => makeScored(`q${i}`, { isOverdue: true }));
    const plan = buildSession({ durationMinutes: 20 }, items);
    expect(plan.estimatedMinutes).toBe(Math.round((plan.questions.length * AVG_SECONDS_PER_ITEM) / 60));
  });

  it('excludes new items when includeNew=false', () => {
    const items = [
      makeScored('new-1', { isNew: true }),
      makeScored('due-1', { isOverdue: true }),
    ];
    const plan = buildSession({ durationMinutes: 10, includeNew: false }, items);
    expect(plan.newCount).toBe(0);
    expect(plan.questions.some((q) => q.id === 'new-1')).toBe(false);
  });

  it('counts due, new, and weak items correctly', () => {
    const items = [
      makeScored('due-1', { isOverdue: true }),
      makeScored('new-1', { isNew: true }),
      makeScored('weak-1', { isWeak: true }),
    ];
    const plan = buildSession({ durationMinutes: 10 }, items);
    expect(plan.dueCount).toBe(1);
    expect(plan.newCount).toBe(1);
    expect(plan.weakCount).toBe(1);
  });

  it('returns no more items than available in pool', () => {
    const items = [makeScored('q1', { isOverdue: true }), makeScored('q2', { isOverdue: true })];
    const plan = buildSession({ durationMinutes: 20 }, items); // target=40, pool=2
    expect(plan.questions.length).toBeLessThanOrEqual(2);
  });

  it('no duplicate questions in session', () => {
    const items = Array.from({ length: 30 }, (_, i) => makeScored(`q${i}`, { isOverdue: true }));
    const plan = buildSession({ durationMinutes: 20 }, items);
    const ids = plan.questions.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
