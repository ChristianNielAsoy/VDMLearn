import { describe, it, expect } from 'vitest';
import { fsrsScheduler } from '@/services/scheduler/fsrs';
import type { SchedulerState, FSRSData } from '@/types/scheduler';

const NOW = new Date('2024-01-01T00:00:00Z').getTime();
const DAY = 24 * 60 * 60 * 1000;

function getFsrsData(state: SchedulerState): FSRSData {
  return state.data as FSRSData;
}

// ─── Reference vector tests ───────────────────────────────────────────────────
// Values derived from ts-fsrs v4.6 defaults (FSRS-5 weights).
// If these fail after a ts-fsrs upgrade, verify intentional weight changes in
// CHANGELOG and update accordingly — do NOT silently widen tolerances.

describe('FSRS-5 reference vectors — initial ratings on a new card', () => {
  it('Again (1): stability=0.2120, difficulty=6.4133', () => {
    const s = fsrsScheduler.computeNextState(null, { objectId: 'q', rating: 1 }, NOW);
    expect(getFsrsData(s).stability).toBeCloseTo(0.212, 3);
    expect(getFsrsData(s).difficulty).toBeCloseTo(6.4133, 3);
  });

  it('Hard (2): stability=1.2931, difficulty=5.1122', () => {
    const s = fsrsScheduler.computeNextState(null, { objectId: 'q', rating: 2 }, NOW);
    expect(getFsrsData(s).stability).toBeCloseTo(1.2931, 3);
    expect(getFsrsData(s).difficulty).toBeCloseTo(5.1122, 3);
  });

  it('Good (3): stability=2.3065, difficulty=2.1181', () => {
    const s = fsrsScheduler.computeNextState(null, { objectId: 'q', rating: 3 }, NOW);
    expect(getFsrsData(s).stability).toBeCloseTo(2.3065, 3);
    expect(getFsrsData(s).difficulty).toBeCloseTo(2.1181, 3);
  });

  it('Easy (4): stability=8.2956, difficulty=1.0000, scheduledDays=8', () => {
    const s = fsrsScheduler.computeNextState(null, { objectId: 'q', rating: 4 }, NOW);
    expect(getFsrsData(s).stability).toBeCloseTo(8.2956, 3);
    expect(getFsrsData(s).difficulty).toBeCloseTo(1.0, 3);
    expect(getFsrsData(s).scheduledDays).toBe(8);
  });
});

describe('FSRS-5 reference vectors — multi-review sequence', () => {
  // Sequence: G(day 0) → G(day 1) → G(day 4) → A(day 14) → G(day 15)
  // Expected values from ts-fsrs v4.6 with default weights.

  function buildSequence() {
    const steps: Array<{ rating: 1 | 2 | 3 | 4; day: number }> = [
      { rating: 3, day: 0 },
      { rating: 3, day: 1 },
      { rating: 3, day: 4 },
      { rating: 1, day: 14 },
      { rating: 3, day: 15 },
    ];
    let state: SchedulerState | null = null;
    const history: SchedulerState[] = [];
    for (const { rating, day } of steps) {
      state = fsrsScheduler.computeNextState(state, { objectId: 'q', rating }, NOW + day * DAY);
      history.push(state);
    }
    return history;
  }

  it('after G→G→G: stability≈19.83, difficulty≈2.10', () => {
    const seq = buildSequence();
    const s3 = seq[2]!;
    expect(getFsrsData(s3).stability).toBeCloseTo(19.833, 2);
    expect(getFsrsData(s3).difficulty).toBeCloseTo(2.104, 2);
  });

  it('after G→G→G→A: stability collapses to ≈1.91, difficulty increases to ≈7.39', () => {
    const seq = buildSequence();
    const s4 = seq[3]!;
    expect(getFsrsData(s4).stability).toBeCloseTo(1.912, 2);
    expect(getFsrsData(s4).difficulty).toBeCloseTo(7.39, 1);
  });

  it('after G→G→G→A→G: recovery: stability≈3.94, scheduledDays=4', () => {
    const seq = buildSequence();
    const s5 = seq[4]!;
    expect(getFsrsData(s5).stability).toBeCloseTo(3.944, 2);
    expect(getFsrsData(s5).scheduledDays).toBe(4);
  });
});

// ─── Behavioral tests ─────────────────────────────────────────────────────────

describe('fsrsScheduler — new card', () => {
  it('rating Good (3) from new card graduates to Review state eventually', () => {
    const s1 = fsrsScheduler.computeNextState(null, { objectId: 'q1', rating: 3 }, NOW);
    expect(s1.objectId).toBe('q1');
    expect(s1.algorithm).toBe('fsrs');
    expect(getFsrsData(s1).reps).toBe(1);
  });

  it('rating Again (1) keeps card in Learning state', () => {
    const s1 = fsrsScheduler.computeNextState(null, { objectId: 'q1', rating: 1 }, NOW);
    expect(getFsrsData(s1).lapses).toBe(0);
    expect(getFsrsData(s1).state).toBeLessThanOrEqual(1);
  });

  it('rating Easy (4) from new card provides longer interval than Good', () => {
    const sGood = fsrsScheduler.computeNextState(null, { objectId: 'q1', rating: 3 }, NOW);
    const sEasy = fsrsScheduler.computeNextState(null, { objectId: 'q1', rating: 4 }, NOW);
    expect(sEasy.dueAt).toBeGreaterThanOrEqual(sGood.dueAt);
  });
});

describe('fsrsScheduler — Review card', () => {
  function buildReviewCard(): SchedulerState {
    const s1 = fsrsScheduler.computeNextState(null, { objectId: 'q1', rating: 3 }, NOW);
    return fsrsScheduler.computeNextState(s1, { objectId: 'q1', rating: 3 }, NOW + DAY);
  }

  it('reaches Review state (2) after two Good answers', () => {
    const state = buildReviewCard();
    expect(getFsrsData(state).state).toBe(2);
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
    expect(getFsrsData(state).state).toBe(0);
  });

  it('isDue returns true when dueAt <= now', () => {
    const state = fsrsScheduler.computeNextState(null, { objectId: 'q1', rating: 1 }, NOW);
    expect(fsrsScheduler.isDue(state, state.dueAt + 1)).toBe(true);
  });
});
