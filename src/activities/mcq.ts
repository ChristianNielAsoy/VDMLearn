import type { ActivityDefinition, GradeResult, ReviewEventMeta } from '@/types/activity';
import type { Question, ChoiceKey } from '@/types/question';
import type { ReviewEvent } from '@/types/review';
import { deriveRating, DEFAULT_RATING_CONFIG } from '@/types/review';
import { activityRegistry } from '@/activities/registry';

const MCQ_DEFAULT_CONFIDENCE = 2 as const; // M1 default; M2 adds confidence tap

const mcqActivity: ActivityDefinition<Question> = {
  type: 'mcq',

  grade(item: Question, response: unknown, startMs: number): GradeResult {
    const chosen = response as ChoiceKey;
    const correct = chosen === item.answer;
    const responseMs = Math.max(0, Date.now() - startMs);
    const rating = deriveRating(correct, MCQ_DEFAULT_CONFIDENCE, responseMs, DEFAULT_RATING_CONFIG);
    return { correct, rating, confidence: MCQ_DEFAULT_CONFIDENCE, responseMs };
  },

  toEvent(item: Question, result: GradeResult, meta: ReviewEventMeta): ReviewEvent {
    return {
      objectId: item.id,
      activityType: 'mcq',
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

activityRegistry.register(mcqActivity);
export { mcqActivity };
