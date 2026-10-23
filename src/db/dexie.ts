import Dexie, { type Table } from 'dexie';
import type { Attempt, Question } from '@/types/question';
import type { SrsProgress } from '@/types/progress';
import type { UserLessonStatus, LessonNote } from '@/types/lesson';
import type { SchoolTask, PlannerSettings } from '@/types/task';
import type { ReviewEvent } from '@/types/review';

interface Bookmark {
  questionId: string;
}

interface Flag {
  questionId: string;
}

class DvmReviewerDb extends Dexie {
  attempts!: Table<Attempt, number>;
  progress!: Table<SrsProgress, string>;
  bookmarks!: Table<Bookmark, string>;
  flags!: Table<Flag, string>;
  importedQuestions!: Table<Question, string>;
  lessonStatus!: Table<UserLessonStatus, string>;
  lessonNotes!: Table<LessonNote, string>;
  tasks!: Table<SchoolTask, string>;
  plannerSettings!: Table<PlannerSettings, string>;
  reviewEvents!: Table<ReviewEvent, number>;

  constructor() {
    super('dvm-reviewer');

    this.version(1).stores({
      attempts: '++id, questionId, timestamp',
    });

    this.version(2).stores({
      progress: '&questionId, dueAt',
      bookmarks: '&questionId',
    });

    this.version(3).stores({
      importedQuestions: '&id, vmleSubject, competencyId',
    });

    this.version(4).stores({
      lessonStatus: '&lessonId',
      lessonNotes: '&lessonId',
    });

    this.version(5).stores({
      tasks: '&id, dueAt, status',
      plannerSettings: '&id',
    });

    this.version(6).stores({
      flags: '&questionId',
    });

    this.version(7).stores({
      reviewEvents: '++id, objectId, sessionId, ts, activityType',
    });
  }
}

export const db = new DvmReviewerDb();
