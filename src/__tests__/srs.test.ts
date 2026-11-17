import { describe, it, expect } from 'vitest';
import { computeNextReview, isDueToday } from '@/services/srs';

const NOW = 1_700_000_000_000;
const DAY = 24 * 60 * 60 * 1000;

describe('computeNextReview', () => {
  it('returns 1-day interval on first correct answer', () => {
    const result = computeNextReview(null, 'q1', true, NOW);
    expect(result.questionId).toBe('q1');
    expect(result.attempts).toBe(1);
    expect(result.correct).toBe(1);
    expect(result.intervalDays).toBe(1);
    expect(result.ease).toBe(2.5);
    expect(result.dueAt).toBe(NOW + DAY);
    expect(result.lastSeenAt).toBe(NOW);
  });

  it('returns 1-day stored interval on first wrong answer (due immediately, same session)', () => {
    const result = computeNextReview(null, 'q1', false, NOW);
    expect(result.attempts).toBe(1);
    expect(result.correct).toBe(0);
    expect(result.intervalDays).toBe(1);
    expect(result.dueAt).toBe(NOW);
  });

  it('jumps to 6-day interval on second consecutive correct answer', () => {
    const prev = computeNextReview(null, 'q1', true, NOW);
    const result = computeNextReview(prev, 'q1', true, NOW + DAY);
    expect(result.intervalDays).toBe(6);
    expect(result.attempts).toBe(2);
    expect(result.correct).toBe(2);
  });

  it('multiplies interval by ease on third correct', () => {
    const p1 = computeNextReview(null, 'q1', true, NOW);
    const p2 = computeNextReview(p1, 'q1', true, NOW + DAY);
    const p3 = computeNextReview(p2, 'q1', true, NOW + 7 * DAY);
    expect(p3.intervalDays).toBe(Math.round(6 * p2.ease));
  });

  it('resets interval to 1 on wrong answer', () => {
    const p1 = computeNextReview(null, 'q1', true, NOW);
    const p2 = computeNextReview(p1, 'q1', true, NOW + DAY);
    const p3 = computeNextReview(p2, 'q1', false, NOW + 7 * DAY);
    expect(p3.intervalDays).toBe(1);
  });

  it('decreases ease on wrong answer but not below 1.3', () => {
    let p = computeNextReview(null, 'q1', false, NOW);
    for (let i = 0; i < 20; i++) {
      p = computeNextReview(p, 'q1', false, NOW + i * DAY);
    }
    expect(p.ease).toBeGreaterThanOrEqual(1.3);
  });

  it('increases ease on correct answer but not above 4.0', () => {
    let p = computeNextReview(null, 'q1', true, NOW);
    for (let i = 0; i < 100; i++) {
      p = computeNextReview(p, 'q1', true, NOW + i * DAY);
    }
    expect(p.ease).toBeLessThanOrEqual(4.0);
  });

  it('accumulates attempts and correct counts', () => {
    const p1 = computeNextReview(null, 'q1', true, NOW);
    const p2 = computeNextReview(p1, 'q1', false, NOW + DAY);
    const p3 = computeNextReview(p2, 'q1', true, NOW + 2 * DAY);
    expect(p3.attempts).toBe(3);
    expect(p3.correct).toBe(2);
  });
});

describe('isDueToday', () => {
  it('returns true when dueAt <= now', () => {
    const p = computeNextReview(null, 'q1', false, NOW);
    expect(isDueToday(p, NOW)).toBe(true);
  });

  it('returns false when dueAt is in the future', () => {
    const p = computeNextReview(null, 'q1', true, NOW);
    expect(isDueToday(p, NOW - 1)).toBe(false);
  });
});
