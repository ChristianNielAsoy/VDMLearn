import type { LearningObject } from '@/types/learningObject';
import type { ReviewEvent } from '@/types/review';

export interface GradeResult {
  correct: boolean;
  rating: 1 | 2 | 3 | 4;
  confidence: 1 | 2 | 3;
  responseMs: number;
}

export interface ReviewEventMeta {
  sessionId: string;
  mode: string;
  ts: number;
}

/**
 * An Activity defines how a LearningObject is graded and how a review event
 * is produced from that grade. The `render` slot is intentionally absent in
 * M1 — it will be added in M2 when session UX is built.
 * TODO M2: add render(item: T) returning a Vue component definition.
 */
export interface ActivityDefinition<T extends LearningObject = LearningObject> {
  /** Matches LearningObject.type or a custom discriminant (e.g. 'mcq', 'flashcard') */
  type: string;
  /**
   * Grade a response to a learning object.
   * @param item    The learning object being reviewed
   * @param response Activity-specific answer payload (ChoiceKey for MCQ, boolean for flashcard)
   * @param startMs  Unix ms when the item was presented (to compute responseMs)
   */
  grade(item: T, response: unknown, startMs: number): GradeResult;
  /** Convert a graded result into an append-only ReviewEvent. */
  toEvent(item: T, result: GradeResult, meta: ReviewEventMeta): ReviewEvent;
}

export interface ActivityRegistry {
  register<T extends LearningObject>(def: ActivityDefinition<T>): void;
  get(type: string): ActivityDefinition | undefined;
  types(): string[];
}
