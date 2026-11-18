import { describe, it, expect } from 'vitest';
import {
  extractClozeFromMarkdown,
  toClozeCards,
  extractAndConvert,
} from '@/services/clozeExtractor';

describe('extractClozeFromMarkdown', () => {
  it('returns empty array when no highlights', () => {
    expect(extractClozeFromMarkdown('No highlights here.')).toHaveLength(0);
  });

  it('extracts one cloze from a single highlight', () => {
    const results = extractClozeFromMarkdown('The ==femur== is the longest bone.');
    expect(results).toHaveLength(1);
    expect(results[0]?.highlight).toBe('femur');
    expect(results[0]?.front).toContain('_____');
    expect(results[0]?.back).toContain('femur');
    expect(results[0]?.front).not.toContain('femur');
  });

  it('replaces only the highlighted word with _____', () => {
    const results = extractClozeFromMarkdown('The ==femur== is the longest bone.');
    expect(results[0]?.front).toBe('The _____ is the longest bone.');
    expect(results[0]?.back).toBe('The femur is the longest bone.');
  });

  it('extracts multiple highlights from the same line as separate cards', () => {
    const results = extractClozeFromMarkdown('The ==femur== and ==tibia== are leg bones.');
    expect(results).toHaveLength(2);
    const highlights = results.map((r) => r.highlight);
    expect(highlights).toContain('femur');
    expect(highlights).toContain('tibia');
  });

  it('skips heading lines', () => {
    const md = '## Osteology\nThe ==femur== is long.';
    const results = extractClozeFromMarkdown(md);
    expect(results).toHaveLength(1);
    expect(results[0]?.highlight).toBe('femur');
  });

  it('skips empty lines', () => {
    const md = '\n\nThe ==femur== is long.\n\n';
    const results = extractClozeFromMarkdown(md);
    expect(results).toHaveLength(1);
  });

  it('handles multi-word highlights', () => {
    const results = extractClozeFromMarkdown('The ==longest bone== in the body is the femur.');
    expect(results[0]?.highlight).toBe('longest bone');
    expect(results[0]?.front).toBe('The _____ in the body is the femur.');
  });

  it('strips markdown formatting from back text', () => {
    const results = extractClozeFromMarkdown('The **==femur==** is long.');
    expect(results[0]?.back).not.toContain('**');
  });
});

describe('toClozeCards', () => {
  it('converts extracts to ClozeCard objects with competencyId and source', () => {
    const extracts = extractClozeFromMarkdown('The ==femur== is the longest bone.');
    const cards = toClozeCards(extracts, 'Veterinary Anatomy:A.1', 'note-highlight', 5000);
    expect(cards).toHaveLength(1);
    expect(cards[0]?.competencyId).toBe('Veterinary Anatomy:A.1');
    expect(cards[0]?.source).toBe('note-highlight');
    expect(cards[0]?.createdAt).toBe(5000);
    expect(cards[0]?.front).toContain('_____');
  });

  it('returns empty array when no extracts', () => {
    expect(toClozeCards([], 'c:1', 'note-highlight', 1000)).toHaveLength(0);
  });
});

describe('extractAndConvert', () => {
  it('produces cloze cards with correct competencyId', () => {
    const md = 'The ==femur== is long. The ==tibia== is shorter.';
    const cards = extractAndConvert(md, 'Veterinary Anatomy:A.1', 1000);
    expect(cards).toHaveLength(2);
    expect(cards.every((c) => c.competencyId === 'Veterinary Anatomy:A.1')).toBe(true);
    expect(cards.every((c) => c.source === 'note-highlight')).toBe(true);
  });
});
