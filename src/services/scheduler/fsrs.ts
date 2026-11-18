import { FSRS, Rating, State, createEmptyCard, type Card, type Grade } from 'ts-fsrs';
import type { SrsProgress } from '@/types/progress';
import type { Scheduler, SchedulerState, FSRSData } from '@/types/scheduler';

const f = new FSRS({});

function isFSRSData(data: SchedulerState['data']): data is FSRSData {
  return 'stability' in data;
}

function fsrsDataToCard(data: FSRSData, dueAt: number, lastSeenAt: number): Card {
  return {
    due: new Date(dueAt),
    stability: data.stability,
    difficulty: data.difficulty,
    elapsed_days: data.elapsedDays,
    scheduled_days: data.scheduledDays,
    reps: data.reps,
    lapses: data.lapses,
    state: data.state,
    last_review: lastSeenAt > 0 ? new Date(lastSeenAt) : undefined,
    learning_steps: data.learningSteps,
  } as Card;
}

function cardToFsrsData(card: Card): FSRSData {
  return {
    stability: card.stability,
    difficulty: card.difficulty,
    elapsedDays: card.elapsed_days,
    scheduledDays: card.scheduled_days,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
    learningSteps: (card as { learning_steps?: number }).learning_steps ?? 0,
  };
}

const RATING_MAP: Record<1 | 2 | 3 | 4, Grade> = {
  1: Rating.Again,
  2: Rating.Hard,
  3: Rating.Good,
  4: Rating.Easy,
};

export const fsrsScheduler: Scheduler = {
  algorithm: 'fsrs',

  fromLegacyProgress(p: SrsProgress): SchedulerState {
    if (p.algorithm === 'fsrs' && p.fsrsStability !== undefined) {
      return {
        objectId: p.questionId,
        algorithm: 'fsrs',
        dueAt: p.dueAt,
        lastSeenAt: p.lastSeenAt,
        data: {
          stability: p.fsrsStability,
          difficulty: p.fsrsDifficulty ?? 0,
          elapsedDays: 0,
          scheduledDays: p.intervalDays,
          reps: p.fsrsReps ?? 0,
          lapses: p.fsrsLapses ?? 0,
          state: p.fsrsState ?? State.New,
          learningSteps: p.fsrsLearningSteps ?? 0,
        },
      };
    }
    // Legacy SM-2 row: start fresh FSRS card
    const empty = createEmptyCard(new Date(p.lastSeenAt > 0 ? p.lastSeenAt : Date.now()));
    return {
      objectId: p.questionId,
      algorithm: 'fsrs',
      dueAt: empty.due.getTime(),
      lastSeenAt: p.lastSeenAt,
      data: cardToFsrsData(empty),
    };
  },

  toSrsProgress(state: SchedulerState): SrsProgress {
    const data = isFSRSData(state.data)
      ? state.data
      : ({
          stability: 0,
          difficulty: 0,
          elapsedDays: 0,
          scheduledDays: 0,
          reps: 0,
          lapses: 0,
          state: State.New,
          learningSteps: 0,
        } satisfies FSRSData);
    return {
      questionId: state.objectId,
      attempts: data.reps,
      correct: Math.max(0, data.reps - data.lapses),
      ease: 2.5,
      intervalDays: data.scheduledDays,
      dueAt: state.dueAt,
      lastSeenAt: state.lastSeenAt,
      algorithm: 'fsrs',
      fsrsStability: data.stability,
      fsrsDifficulty: data.difficulty,
      fsrsState: data.state,
      fsrsReps: data.reps,
      fsrsLapses: data.lapses,
      fsrsLearningSteps: data.learningSteps,
    };
  },

  computeNextState(prev, event, now = Date.now()): SchedulerState {
    const nowDate = new Date(now);
    const card: Card =
      prev && isFSRSData(prev.data)
        ? fsrsDataToCard(prev.data, prev.dueAt, prev.lastSeenAt)
        : createEmptyCard(nowDate);

    const fsrsRating = RATING_MAP[event.rating];
    const scheduling = f.repeat(card, nowDate);
    const nextCard = scheduling[fsrsRating].card;

    return {
      objectId: event.objectId,
      algorithm: 'fsrs',
      dueAt: nextCard.due.getTime(),
      lastSeenAt: now,
      data: cardToFsrsData(nextCard),
    };
  },

  isDue(state, now = Date.now()): boolean {
    return state.dueAt <= now;
  },
};
