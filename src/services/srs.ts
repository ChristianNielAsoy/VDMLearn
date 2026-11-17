import type { SrsProgress } from '@/types/progress';

const DEFAULT_EASE = 2.5;
const MIN_EASE = 1.3;

export function computeNextReview(
  prev: SrsProgress | null,
  questionId: string,
  wasCorrect: boolean,
  now = Date.now(),
): SrsProgress {
  if (!prev) {
    const intervalDays = wasCorrect ? 1 : 0;
    return {
      questionId,
      attempts: 1,
      correct: wasCorrect ? 1 : 0,
      ease: DEFAULT_EASE,
      intervalDays: Math.max(1, intervalDays),
      dueAt: now + intervalDays * 24 * 60 * 60 * 1000,
      lastSeenAt: now,
    };
  }

  const attempts = prev.attempts + 1;
  const correct = prev.correct + (wasCorrect ? 1 : 0);

  let ease: number;
  let intervalDays: number;

  if (wasCorrect) {
    ease = Math.min(prev.ease + 0.1, 4.0);
    intervalDays = prev.intervalDays <= 1 ? 6 : Math.round(prev.intervalDays * prev.ease);
  } else {
    ease = Math.max(MIN_EASE, prev.ease - 0.2);
    intervalDays = 1;
  }

  return {
    questionId,
    attempts,
    correct,
    ease,
    intervalDays,
    dueAt: now + intervalDays * 24 * 60 * 60 * 1000,
    lastSeenAt: now,
  };
}

export function isDueToday(progress: SrsProgress, now = Date.now()): boolean {
  return progress.dueAt <= now;
}
