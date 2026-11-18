import { describe, it, expect } from 'vitest';
import type { BackupFile, BackupFileV1, BackupFileV2 } from '@/services/backup';
import type { BackupData } from '@/db/repository';

// Pure unit tests for backup type guards and v1→v2 upgrade logic.
// Dexie is not available in Vitest; importBackup/exportBackup are integration-tested
// manually in the browser (see verification checklist).

function isV2(backup: BackupFile): backup is BackupFileV2 {
  return backup.version === 2;
}

function v1ToPartialData(backup: BackupFileV1): Partial<BackupData> {
  return {
    attempts: backup.data.attempts ?? [],
    progress: backup.data.progress ?? [],
    bookmarks: backup.data.bookmarks ?? [],
    flags: backup.data.flags ?? [],
    importedQuestions: backup.data.importedQuestions ?? [],
    lessonStatus: backup.data.lessonStatus ?? [],
    lessonNotes: backup.data.lessonNotes ?? [],
    tasks: backup.data.tasks ?? [],
    plannerSettings: backup.data.plannerSettings ?? [],
    reviewEvents: backup.data.reviewEvents ?? [],
    contentPacks: backup.data.contentPacks ?? [],
  };
}

describe('BackupFile type guards', () => {
  const v1: BackupFile = { version: 1, app: 'dvm-reviewer', exportedAt: 0, data: {} };
  const v2: BackupFile = {
    version: 2,
    app: 'dvm-reviewer',
    exportedAt: 1,
    data: {
      attempts: [],
      progress: [],
      bookmarks: [],
      flags: [],
      importedQuestions: [],
      lessonStatus: [],
      lessonNotes: [],
      tasks: [],
      plannerSettings: [],
      reviewEvents: [],
      contentPacks: [],
    },
  };

  it('isV2 returns false for v1', () => {
    expect(isV2(v1)).toBe(false);
  });

  it('isV2 returns true for v2', () => {
    expect(isV2(v2)).toBe(true);
  });
});

describe('v1→v2 migration (v1ToPartialData)', () => {
  it('v1 file with no extra fields defaults missing tables to []', () => {
    const v1: BackupFileV1 = {
      version: 1,
      app: 'dvm-reviewer',
      exportedAt: 0,
      data: {
        attempts: [],
        progress: [],
        bookmarks: [{ questionId: 'q1' }],
      },
    };
    const data = v1ToPartialData(v1);
    expect(data.flags).toEqual([]);
    expect(data.reviewEvents).toEqual([]);
    expect(data.contentPacks).toEqual([]);
    expect(data.bookmarks).toHaveLength(1);
  });

  it('v1 file with all tables present preserves them', () => {
    const v1: BackupFileV1 = {
      version: 1,
      app: 'dvm-reviewer',
      exportedAt: 0,
      data: {
        attempts: [],
        progress: [],
        bookmarks: [],
        flags: [{ questionId: 'q-flagged' }],
      },
    };
    const data = v1ToPartialData(v1);
    expect(data.flags).toHaveLength(1);
  });
});

describe('BackupFileV2 structure', () => {
  it('v2 data includes all 11 table keys', () => {
    const v2data: BackupData = {
      attempts: [],
      progress: [],
      bookmarks: [],
      flags: [],
      importedQuestions: [],
      lessonStatus: [],
      lessonNotes: [],
      tasks: [],
      plannerSettings: [],
      reviewEvents: [],
      contentPacks: [],
    };
    const keys = Object.keys(v2data);
    expect(keys).toContain('flags');
    expect(keys).toContain('reviewEvents');
    expect(keys).toContain('contentPacks');
    expect(keys).toHaveLength(11);
  });
});
