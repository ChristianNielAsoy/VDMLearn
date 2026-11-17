import { describe, test, expect } from 'vitest';
import { isCorrect } from '@/types/question';
import type { ChoiceKey } from '@/types/question';

describe('isCorrect', () => {
  test('returns true when chosen equals answer', () => {
    const pairs: [ChoiceKey, ChoiceKey][] = [
      ['A', 'A'],
      ['B', 'B'],
      ['C', 'C'],
      ['D', 'D'],
    ];
    for (const [chosen, answer] of pairs) {
      expect(isCorrect(chosen, answer)).toBe(true);
    }
  });

  test('returns false when chosen differs from answer', () => {
    expect(isCorrect('A', 'B')).toBe(false);
    expect(isCorrect('B', 'A')).toBe(false);
    expect(isCorrect('C', 'D')).toBe(false);
    expect(isCorrect('D', 'A')).toBe(false);
  });
});
