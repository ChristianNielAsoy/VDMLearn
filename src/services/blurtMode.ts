import type { CompetencyNote, BlurtSession } from '@/types/notes';
import type { ReviewEvent } from '@/types/review';

export interface BlurtPrompt {
  competencyId: string;
  /** Short instruction shown at top of blurt screen */
  instruction: string;
  /** Key points extracted from note (used in the reveal phase) */
  keyPoints: string[];
}

/**
 * Builds the blurt prompt for a given competency note.
 * Key points are extracted from unordered list items and headings in the note.
 */
export function buildBlurtPrompt(note: CompetencyNote): BlurtPrompt {
  const keyPoints = extractKeyPoints(note.bodyMd);
  return {
    competencyId: note.competencyId,
    instruction: `Write everything you remember about: ${note.competencyId.replace(/^[^:]+:/, '')}`,
    keyPoints,
  };
}

function extractKeyPoints(bodyMd: string): string[] {
  const points: string[] = [];
  for (const line of bodyMd.split('\n')) {
    const trimmed = line.trim();
    // Unordered list items
    if (/^[-*+]\s+(.+)/.test(trimmed)) {
      const text = trimmed.replace(/^[-*+]\s+/, '').replace(/==/g, '').trim();
      if (text) points.push(text);
    }
    // Headings (H2 and below become key topics)
    else if (/^#{2,6}\s+(.+)/.test(trimmed)) {
      const text = trimmed.replace(/^#{2,6}\s+/, '').trim();
      if (text) points.push(text);
    }
    // Bold phrases as inline key points
    else if (/\*\*([^*]+)\*\*/.test(trimmed)) {
      const matches = trimmed.matchAll(/\*\*([^*]+)\*\*/g);
      for (const m of matches) {
        if (m[1]) points.push(m[1]);
      }
    }
  }
  return points;
}

/**
 * Maps a blurt self-score (1-3) to an SM-2 / review rating (1-4).
 * Score 1 (poor) → rating 1 (again); 2 (partial) → rating 2; 3 (good) → rating 3.
 * Rating 4 is reserved for the MCQ fast-confident path and not used here.
 */
export function deriveBlurtRating(selfScore: 1 | 2 | 3): 1 | 2 | 3 {
  return selfScore; // direct mapping on the 1-3 range
}

/**
 * Builds a BlurtSession record (without id) ready for DB insertion.
 */
export function buildBlurtSession(
  competencyId: string,
  selfScore: 1 | 2 | 3,
  now = Date.now(),
): Omit<BlurtSession, 'id'> {
  return { competencyId, selfScore, ts: now };
}

/**
 * Builds a ReviewEvent stub for a blurt session.
 * objectId = competencyId; activityType = 'blurt'; correct = selfScore >= 2.
 */
export function buildBlurtReviewEvent(
  competencyId: string,
  selfScore: 1 | 2 | 3,
  sessionId: string,
  responseMs: number,
  now = Date.now(),
): Omit<ReviewEvent, 'id'> {
  const rating = deriveBlurtRating(selfScore);
  return {
    objectId: competencyId,
    activityType: 'blurt',
    correct: selfScore >= 2,
    rating,
    confidence: selfScore,
    responseMs,
    mode: 'blurt',
    sessionId,
    ts: now,
  };
}
