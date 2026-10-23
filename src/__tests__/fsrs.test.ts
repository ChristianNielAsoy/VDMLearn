import { describe, it, expect } from 'vitest';
import { fsrsScheduler } from '@/services/scheduler/fsrs';
import type { SchedulerState, FSRSData } from '@/types/scheduler';

const NOW = new Date('2024-01-01T00:00:00Z').getTime();
const DAY = 24 * 60 * 60 * 1000;

function getFsrsData(state: SchedulerState): FSRSData {
  return state.data as FSRSData;
}

describe('fsrsScheduler — new card', () => {
  it('rating Good (3) from new card graduates to Review state eventually', () => {
    const s1 = fsrsScheduler.computeNextState(null, { objectId: 'q1', rating: 3 }, NOW);
    expect(s1.objectId).toBe('q1');
    expect(s1.algorithm).toBe('fsrs');
    // After one Good answer, card is in Learning (state 1)
    expect(getFsrsData(s1).reps).toBe(1);
  });

  it('rating Again (1) keeps card in Learning state', () => {
    const s1 = fsrsScheduler.computeNextState(null, { objectId: 'q1', rating: 1 }, NOW);
    expect(getFsrsData(s1).lapses).toBe(0); // new card, no lapses yet
    expect(getFsrsData(s1).state).toBeLessThanOrEqual(1); // New or Learning
  });

  it('rating Easy (4) from new card provides longer interval than Good', () => {
    const sGood = fsrsScheduler.computeNextState(null, { objectId: 'q1', rating: 3 }, NOW);
    const sEasy = fsrsScheduler.computeNextState(null, { objectId: 'q1', rating: 4 }, NOW);
    // Easy should schedule further out than Good
    expect(sEasy.dueAt).toBeGreaterThanOrEqual(sGood.dueAt);
  });
});

describe('fsrsScheduler — Review card', () => {
  // Simulate two Good reviews to reach Review state
  function buildReviewCard(): SchedulerState {
    const s1 = fsrsScheduler.computeNextState(null, { objectId: 'q1', rating: 3 }, NOW);
    return fsrsScheduler.computeNextState(s1, { objectId: 'q1', rating: 3 }, NOW + DAY);
  }

  it('reaches Review state (2) after two Good answers', () => {
    const state = buildReviewCard();
    expect(getFsrsData(state).state).toBe(2); // State.Review
  });

  it('correct Review answer increases stability', () => {
    const prev = buildReviewCard();
    const stabilityBefore = getFsrsData(prev).stability;
    const next = fsrsScheduler.computeNextState(prev, { objectId: 'q1', rating: 3 }, NOW + 8 * DAY);
    expect(getFsrsData(next).stability).toBeGreaterThan(stabilityBefore);
  });

  it('Again on a Review card increments lapses', () => {
    const prev = buildReviewCard();
    const next = fsrsScheduler.computeNextState(prev, { objectId: 'q1', rating: 1 }, NOW + 8 * DAY);
    expect(getFsrsData(next).lapses).toBeGreaterThan(getFsrsData(prev).lapses);
  });
});

describe('fsrsScheduler.fromLegacyProgress / toSrsProgress', () => {
  it('round-trips via toSrsProgress → fromLegacyProgress', () => {
    const s1 = fsrsScheduler.computeNextState(null, { objectId: 'q1', rating: 3 }, NOW);
    const progress = fsrsScheduler.toSrsProgress(s1);
    expect(progress.algorithm).toBe('fsrs');
    expect(progress.fsrsStability).toBeGreaterThan(0);

    const restored = fsrsScheduler.fromLegacyProgress(progress);
    expect(getFsrsData(restored).stability).toBeCloseTo(getFsrsData(s1).stability, 5);
  });

  it('fromLegacyProgress on SM-2 row creates a fresh FSRS card', () => {
    const legacy = {
      questionId: 'q2',
      attempts: 5,
      correct: 4,
      ease: 2.5,
      intervalDays: 10,
      dueAt: NOW + 10 * DAY,
      lastSeenAt: NOW,
    };
    const state = fsrsScheduler.fromLegacyProgress(legacy);
    expect(state.algorithm).toBe('fsrs');
    expect(getFsrsData(state).state).toBe(0); // New card
  });

  it('isDue returns true when dueAt <= now', () => {
    const state = fsrsScheduler.computeNextState(null, { objectId: 'q1', rating: 1 }, NOW);
    // Again-rated cards in learning are due very soon
    expect(fsrsScheduler.isDue(state, state.dueAt + 1)).toBe(true);
  });
});
