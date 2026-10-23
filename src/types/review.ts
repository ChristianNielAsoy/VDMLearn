/**
 * Append-only log entry written every time a learning object is reviewed.
 * Rating rule (configurable via RatingConfig):
 *   wrong                             → 1
 *   right + confidence 1 (low)        → 2
 *   right + confidence 2 (medium)     → 3
 *   right + confidence 3 (high) + fast (< fastThresholdMs) → 4
 *   right + confidence 3 (high) + slow                     → 3
 *
 * In M1, confidence is always logged as 2 (medium/unknown) because the UI
 * does not yet have a confidence tap. M2 will add it.
 */
export interface ReviewEvent {
  id?: number; // Dexie auto-increment PK; absent before insertion
  objectId: string; // LearningObject.id
  activityType: string; // 'mcq' | 'flashcard' | …
  correct: boolean;
  rating: 1 | 2 | 3 | 4;
  confidence: 1 | 2 | 3; // user-provided; default 2 until M2
  responseMs: number; // wall-clock ms from item presentation to answer
  mode: string; // QuizScope.type: 'competency' | 'course' | 'due' | 'mock' | …
  sessionId: string; // UUID generated at session start
  ts: number; // unix ms timestamp of the answer
}

export interface RatingConfig {
  /** Responses faster than this (ms) qualify for rating 4. Default: 10 000. */
  fastThresholdMs: number;
}

export const DEFAULT_RATING_CONFIG: RatingConfig = { fastThresholdMs: 10_000 };

/**
 * Derive a 1-4 rating from correctness, confidence, and speed.
 * The rule is intentionally simple and fully covered by tests so it can be
 * adjusted without breaking callers.
 */
export function deriveRating(
  correct: boolean,
  confidence: 1 | 2 | 3,
  responseMs: number,
  config: RatingConfig = DEFAULT_RATING_CONFIG,
): 1 | 2 | 3 | 4 {
  if (!correct) return 1;
  if (confidence === 1) return 2;
  if (confidence === 2) return 3;
  // confidence === 3 (high)
  return responseMs < config.fastThresholdMs ? 4 : 3;
}
