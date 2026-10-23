export interface SrsProgress {
  questionId: string;
  attempts: number;
  correct: number;
  ease: number;
  intervalDays: number;
  dueAt: number;
  lastSeenAt: number;
  algorithm?: 'sm2' | 'fsrs';
  // FSRS-specific fields (present when algorithm === 'fsrs')
  fsrsStability?: number;
  fsrsDifficulty?: number;
  fsrsState?: number;
  fsrsReps?: number;
  fsrsLapses?: number;
  fsrsLearningSteps?: number;
}
