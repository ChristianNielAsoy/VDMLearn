import { describe, it, expect } from 'vitest';
import { buildBlurtPrompt, deriveBlurtRating, buildBlurtSession, buildBlurtReviewEvent } from '@/services/blurtMode';
import type { CompetencyNote } from '@/types/notes';

const NOTE: CompetencyNote = {
  competencyId: 'Veterinary Anatomy:A.1',
  bodyMd: `## Osteology
The femur is the longest bone.

- Long bones: femur, tibia, fibula
- Short bones: carpals, tarsals
**Periosteum** covers bone surface.`,
  updatedAt: 5000,
};

describe('buildBlurtPrompt', () => {
  it('sets competencyId from note', () => {
    const prompt = buildBlurtPrompt(NOTE);
    expect(prompt.competencyId).toBe('Veterinary Anatomy:A.1');
  });

  it('includes an instruction string', () => {
    const prompt = buildBlurtPrompt(NOTE);
    expect(typeof prompt.instruction).toBe('string');
    expect(prompt.instruction.length).toBeGreaterThan(0);
  });

  it('extracts heading as a key point', () => {
    const prompt = buildBlurtPrompt(NOTE);
    expect(prompt.keyPoints).toContain('Osteology');
  });

  it('extracts list items as key points', () => {
    const prompt = buildBlurtPrompt(NOTE);
    expect(prompt.keyPoints.some((k) => k.includes('Long bones'))).toBe(true);
    expect(prompt.keyPoints.some((k) => k.includes('Short bones'))).toBe(true);
  });

  it('extracts bold phrases as key points', () => {
    const prompt = buildBlurtPrompt(NOTE);
    expect(prompt.keyPoints).toContain('Periosteum');
  });

  it('returns empty keyPoints for a plain note', () => {
    const plainNote: CompetencyNote = { competencyId: 'c:1', bodyMd: 'Just plain text.', updatedAt: 0 };
    const prompt = buildBlurtPrompt(plainNote);
    expect(prompt.keyPoints).toHaveLength(0);
  });
});

describe('deriveBlurtRating', () => {
  it('score 1 → rating 1', () => {
    expect(deriveBlurtRating(1)).toBe(1);
  });

  it('score 2 → rating 2', () => {
    expect(deriveBlurtRating(2)).toBe(2);
  });

  it('score 3 → rating 3', () => {
    expect(deriveBlurtRating(3)).toBe(3);
  });
});

describe('buildBlurtSession', () => {
  it('builds session with correct fields', () => {
    const session = buildBlurtSession('Veterinary Anatomy:A.1', 2, 9000);
    expect(session.competencyId).toBe('Veterinary Anatomy:A.1');
    expect(session.selfScore).toBe(2);
    expect(session.ts).toBe(9000);
    expect((session as { id?: number }).id).toBeUndefined();
  });
});

describe('buildBlurtReviewEvent', () => {
  it('sets activityType to "blurt"', () => {
    const event = buildBlurtReviewEvent('c:1', 2, 'session-1', 5000, 9000);
    expect(event.activityType).toBe('blurt');
  });

  it('score 1 → correct: false', () => {
    const event = buildBlurtReviewEvent('c:1', 1, 'session-1', 5000, 9000);
    expect(event.correct).toBe(false);
  });

  it('score 2 → correct: true', () => {
    const event = buildBlurtReviewEvent('c:1', 2, 'session-1', 5000, 9000);
    expect(event.correct).toBe(true);
  });

  it('score 3 → correct: true', () => {
    const event = buildBlurtReviewEvent('c:1', 3, 'session-1', 5000, 9000);
    expect(event.correct).toBe(true);
  });

  it('maps score to rating correctly', () => {
    expect(buildBlurtReviewEvent('c:1', 1, 's', 1000, 9000).rating).toBe(1);
    expect(buildBlurtReviewEvent('c:1', 2, 's', 1000, 9000).rating).toBe(2);
    expect(buildBlurtReviewEvent('c:1', 3, 's', 1000, 9000).rating).toBe(3);
  });

  it('mode is "blurt"', () => {
    const event = buildBlurtReviewEvent('c:1', 2, 'session-1', 5000, 9000);
    expect(event.mode).toBe('blurt');
  });

  it('sessionId and ts are set correctly', () => {
    const event = buildBlurtReviewEvent('c:1', 2, 'my-session', 1234, 9999);
    expect(event.sessionId).toBe('my-session');
    expect(event.ts).toBe(9999);
    expect(event.responseMs).toBe(1234);
  });
});
