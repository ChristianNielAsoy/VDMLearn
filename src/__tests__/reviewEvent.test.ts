import { describe, it, expect } from 'vitest';
import { deriveRating, DEFAULT_RATING_CONFIG } from '@/types/review';

describe('deriveRating', () => {
  it('wrong answer → 1', () => {
    expect(deriveRating(false, 2, 1000)).toBe(1);
  });

  it('right + confidence 1 (low) → 2', () => {
    expect(deriveRating(true, 1, 1000)).toBe(2);
  });

  it('right + confidence 2 (medium) → 3', () => {
    expect(deriveRating(true, 2, 1000)).toBe(3);
  });

  it('right + confidence 3 (high) + fast → 4', () => {
    const fast = DEFAULT_RATING_CONFIG.fastThresholdMs - 1;
    expect(deriveRating(true, 3, fast)).toBe(4);
  });

  it('right + confidence 3 (high) + slow → 3', () => {
    const slow = DEFAULT_RATING_CONFIG.fastThresholdMs + 1;
    expect(deriveRating(true, 3, slow)).toBe(3);
  });

  it('custom threshold is respected', () => {
    const config = { fastThresholdMs: 3000 };
    expect(deriveRating(true, 3, 2999, config)).toBe(4);
    expect(deriveRating(true, 3, 3001, config)).toBe(3);
  });
});
