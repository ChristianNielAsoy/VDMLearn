import Dexie, { type Table } from 'dexie';
import type { Attempt, Question } from '@/types/question';
import type { SrsProgress } from '@/types/progress';
import type { UserLessonStatus, LessonNote } from '@/types/lesson';
import type { SchoolTask, PlannerSettings } from '@/types/task';
import type { ReviewEvent } from '@/types/review';
import type { InstalledPack } from '@/types/contentPack';
import type { OnboardingProfile } from '@/types/onboarding';
import type { MistakeEntry, CompetencyNote, ClozeCard, BlurtSession } from '@/types/notes';
import type { ResourceEntry } from '@/types/resource';

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
  contentPacks!: Table<InstalledPack, string>;
  onboardingProfile!: Table<OnboardingProfile, string>;
  mistakeEntries!: Table<MistakeEntry, number>;
  competencyNotes!: Table<CompetencyNote, string>;
  clozeCards!: Table<ClozeCard, number>;
  blurtSessions!: Table<BlurtSession, number>;
  resources!: Table<ResourceEntry, number>;

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

    this.version(8)
      .stores({
        contentPacks: '&packId',
        importedQuestions: '&id, vmleSubject, competencyId, *competencyIds, packId',
      })
      .upgrade(async (tx) => {
        await tx
          .table('importedQuestions')
          .toCollection()
          .modify((q: Question) => {
            if (!q.competencyIds || q.competencyIds.length === 0) {
              q.competencyIds = [q.competencyId];
            }
            if (!q.updatedAt) q.updatedAt = 0;
            if (!q.version) q.version = 1;
          });
      });

    this.version(9).stores({
      onboardingProfile: '&id',
    });

    this.version(10).stores({
      mistakeEntries: '++id, questionId, ts',
      competencyNotes: '&competencyId, updatedAt',
      clozeCards: '++id, competencyId, createdAt',
      blurtSessions: '++id, competencyId, ts',
    });

    this.version(11).stores({
      resources: '++id, competencyId, type',
    });
  }
}

export const db = new DvmReviewerDb();
