import type { SrsProgress } from '@/types/progress';

export interface SM2Data {
  attempts: number;
  correct: number;
  ease: number;
  intervalDays: number;
}

export interface FSRSData {
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
  /** 0=New 1=Learning 2=Review 3=Relearning */
  state: number;
  learningSteps: number;
}

export interface SchedulerState {
  objectId: string;
  algorithm: 'sm2' | 'fsrs';
  dueAt: number;
  lastSeenAt: number;
  data: SM2Data | FSRSData;
}

export interface Scheduler {
  readonly algorithm: 'sm2' | 'fsrs';
  computeNextState(
    prev: SchedulerState | null,
    event: { objectId: string; rating: 1 | 2 | 3 | 4 },
    now?: number,
  ): SchedulerState;
  isDue(state: SchedulerState, now?: number): boolean;
  fromLegacyProgress(p: SrsProgress): SchedulerState;
  toSrsProgress(state: SchedulerState): SrsProgress;
}
