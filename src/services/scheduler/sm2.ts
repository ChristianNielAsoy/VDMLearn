import type { SrsProgress } from '@/types/progress';
import type { Scheduler, SchedulerState, SM2Data } from '@/types/scheduler';
import { computeNextReview } from '@/services/srs';

function isSM2Data(data: SchedulerState['data']): data is SM2Data {
  return 'ease' in data;
}

export const sm2Scheduler: Scheduler = {
  algorithm: 'sm2',

  fromLegacyProgress(p: SrsProgress): SchedulerState {
    return {
      objectId: p.questionId,
      algorithm: 'sm2',
      dueAt: p.dueAt,
      lastSeenAt: p.lastSeenAt,
      data: {
        attempts: p.attempts,
        correct: p.correct,
        ease: p.ease,
        intervalDays: p.intervalDays,
      },
    };
  },

  toSrsProgress(state: SchedulerState): SrsProgress {
    const data = isSM2Data(state.data)
      ? state.data
      : { attempts: 0, correct: 0, ease: 2.5, intervalDays: 0 };
    return {
      questionId: state.objectId,
      attempts: data.attempts,
      correct: data.correct,
      ease: data.ease,
      intervalDays: data.intervalDays,
      dueAt: state.dueAt,
      lastSeenAt: state.lastSeenAt,
      algorithm: 'sm2',
    };
  },

  computeNextState(prev, event, now = Date.now()): SchedulerState {
    const wasCorrect = event.rating > 1;

    // Convert SchedulerState → SrsProgress for the existing SM-2 implementation
    const prevProgress: SrsProgress | null = prev
      ? {
          questionId: event.objectId,
          dueAt: prev.dueAt,
          lastSeenAt: prev.lastSeenAt,
          ...(isSM2Data(prev.data)
            ? {
                attempts: prev.data.attempts,
                correct: prev.data.correct,
                ease: prev.data.ease,
                intervalDays: prev.data.intervalDays,
              }
            : { attempts: 0, correct: 0, ease: 2.5, intervalDays: 0 }),
        }
      : null;

    const next = computeNextReview(prevProgress, event.objectId, wasCorrect, now);

    // Fix: first wrong answer should store intervalDays: 0, not 1 (srs.ts has Math.max(1,...))
    const intervalDays = !wasCorrect && !prev ? 0 : next.intervalDays;

    return {
      objectId: event.objectId,
      algorithm: 'sm2',
      dueAt: next.dueAt,
      lastSeenAt: next.lastSeenAt,
      data: {
        attempts: next.attempts,
        correct: next.correct,
        ease: next.ease,
        intervalDays,
      },
    };
  },

  isDue(state, now = Date.now()): boolean {
    return state.dueAt <= now;
  },
};
