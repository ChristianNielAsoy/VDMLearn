import type { ActivityDefinition, GradeResult, ReviewEventMeta } from '@/types/activity';
import type { LearningObject } from '@/types/learningObject';
import type { ReviewEvent } from '@/types/review';
import { activityRegistry } from '@/activities/registry';

/** Minimal shape for a flashcard learning object. */
export interface FlashcardItem extends LearningObject {
  type: 'card';
  front: string;
  back: string;
}

/**
 * Flashcard response payload: { known: boolean }.
 * `known = true`  → rating 4 (high confidence, assumed fast since flip is immediate)
 * `known = false` → rating 1 (wrong / needs more review)
 * Confidence is fixed at 3 for known (the user decided they know it) and 1 for unknown.
 */
const flashcardActivity: ActivityDefinition<FlashcardItem> = {
  type: 'flashcard',

  grade(_item: FlashcardItem, response: unknown, startMs: number): GradeResult {
    const { known } = response as { known: boolean };
    const responseMs = Math.max(0, Date.now() - startMs);
    if (known) {
      return { correct: true, rating: 4, confidence: 3, responseMs };
    }
    return { correct: false, rating: 1, confidence: 1, responseMs };
  },

  toEvent(item: FlashcardItem, result: GradeResult, meta: ReviewEventMeta): ReviewEvent {
    return {
      objectId: item.id,
      activityType: 'flashcard',
      correct: result.correct,
      rating: result.rating,
      confidence: result.confidence,
      responseMs: result.responseMs,
      mode: meta.mode,
      sessionId: meta.sessionId,
      ts: meta.ts,
    };
  },
};

activityRegistry.register(flashcardActivity);
export { flashcardActivity };
