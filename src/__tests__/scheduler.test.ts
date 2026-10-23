import { describe, it, expect } from 'vitest';
import { sm2Scheduler } from '@/services/scheduler/sm2';
import type { SrsProgress } from '@/types/progress';

const NOW = 1_700_000_000_000;
const DAY = 24 * 60 * 60 * 1000;

const baseLegacy: SrsProgress = {
  questionId: 'q1',
  attempts: 3,
  correct: 2,
  ease: 2.5,
  intervalDays: 6,
  dueAt: NOW,
  lastSeenAt: NOW - DAY,
};

describe('sm2Scheduler.fromLegacyProgress', () => {
  it('maps SrsProgress fields to SchedulerState', () => {
    const state = sm2Scheduler.fromLegacyProgress(baseLegacy);
    expect(state.objectId).toBe('q1');
    expect(state.algorithm).toBe('sm2');
    expect(state.dueAt).toBe(NOW);
    expect(state.lastSeenAt).toBe(NOW - DAY);
    const data = state.data as { ease: number; intervalDays: number };
    expect(data.ease).toBe(2.5);
    expect(data.intervalDays).toBe(6);
  });
});

describe('sm2Scheduler.toSrsProgress', () => {
  it('round-trips a SchedulerState back to SrsProgress', () => {
    const state = sm2Scheduler.fromLegacyProgress(baseLegacy);
    const progress = sm2Scheduler.toSrsProgress(state);
    expect(progress.questionId).toBe('q1');
    expect(progress.ease).toBe(2.5);
    expect(progress.intervalDays).toBe(6);
    expect(progress.dueAt).toBe(NOW);
  });
});

describe('sm2Scheduler.computeNextState', () => {
  it('first correct answer (rating 3) → 1-day interval', () => {
    const state = sm2Scheduler.computeNextState(null, { objectId: 'q1', rating: 3 }, NOW);
    expect(state.objectId).toBe('q1');
    expect(state.dueAt).toBe(NOW + DAY);
    const data = state.data as { intervalDays: number };
    expect(data.intervalDays).toBe(1);
  });

  it('first wrong answer (rating 1) → intervalDays: 0, dueAt: now (fixed)', () => {
    const state = sm2Scheduler.computeNextState(null, { objectId: 'q1', rating: 1 }, NOW);
    const data = state.data as { intervalDays: number };
    expect(data.intervalDays).toBe(0); // SM-2 wrapper fix
    expect(state.dueAt).toBe(NOW);
  });

  it('correct answer after history → increases interval', () => {
    const prev = sm2Scheduler.fromLegacyProgress(baseLegacy); // intervalDays: 6
    const state = sm2Scheduler.computeNextState(prev, { objectId: 'q1', rating: 3 }, NOW);
    const data = state.data as { intervalDays: number };
    expect(data.intervalDays).toBeGreaterThan(6);
  });

  it('wrong answer (rating 1) resets to 1-day interval when prev exists', () => {
    const prev = sm2Scheduler.fromLegacyProgress(baseLegacy);
    const state = sm2Scheduler.computeNextState(prev, { objectId: 'q1', rating: 1 }, NOW);
    const data = state.data as { intervalDays: number };
    expect(data.intervalDays).toBe(1);
  });

  it('isDue returns true when dueAt <= now', () => {
    const state = sm2Scheduler.computeNextState(null, { objectId: 'q1', rating: 1 }, NOW);
    expect(sm2Scheduler.isDue(state, NOW)).toBe(true);
  });

  it('isDue returns false when dueAt is in future', () => {
    const state = sm2Scheduler.computeNextState(null, { objectId: 'q1', rating: 3 }, NOW);
    expect(sm2Scheduler.isDue(state, NOW - 1)).toBe(false);
  });
});
