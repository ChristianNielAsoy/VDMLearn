import { localRepository, type BackupData } from '@/db/repository';

// ── Types ────────────────────────────────────────────────────────────────────

export interface BackupFileV1 {
  version: 1;
  app: 'dvm-reviewer';
  exportedAt: number;
  data: Partial<BackupData>;
}

export interface BackupFileV2 {
  version: 2;
  app: 'dvm-reviewer';
  exportedAt: number;
  data: BackupData;
}

export type BackupFile = BackupFileV1 | BackupFileV2;

// ── Export ───────────────────────────────────────────────────────────────────

export async function exportBackup(): Promise<void> {
  const data = await localRepository.exportAll();
  const backup: BackupFileV2 = {
    version: 2,
    app: 'dvm-reviewer',
    exportedAt: Date.now(),
    data,
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `dvm-reviewer-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Import ───────────────────────────────────────────────────────────────────

export async function importBackup(file: File): Promise<{ summary: string[] }> {
  const text = await file.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('File is not valid JSON');
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    (parsed as { app?: string }).app !== 'dvm-reviewer'
  ) {
    throw new Error('Not a valid DVM Reviewer backup file');
  }

  const version = (parsed as { version?: number }).version;
  if (version !== 1 && version !== 2) {
    throw new Error(`Unsupported backup version: ${String(version)}`);
  }

  const data = (parsed as BackupFile).data as Partial<BackupData>;
  await localRepository.importAll(data);

  const summary: string[] = [];
  type ArrayKey = Exclude<keyof BackupData, 'onboardingProfile'>;
  const counts: [ArrayKey, string][] = [
    ['attempts', 'quiz attempts'],
    ['progress', 'SRS records'],
    ['bookmarks', 'bookmarks'],
    ['flags', 'flagged questions'],
    ['importedQuestions', 'imported questions'],
    ['lessonStatus', 'lesson statuses'],
    ['lessonNotes', 'lesson notes'],
    ['tasks', 'tasks'],
    ['plannerSettings', 'settings'],
    ['reviewEvents', 'review events'],
    ['contentPacks', 'content packs'],
    ['mistakeEntries', 'mistake entries'],
    ['competencyNotes', 'competency notes'],
    ['clozeCards', 'cloze cards'],
    ['blurtSessions', 'blurt sessions'],
  ];
  for (const [key, label] of counts) {
    const arr = data[key];
    if (arr && arr.length > 0) summary.push(`${arr.length} ${label}`);
  }
  if (data.onboardingProfile) summary.push('onboarding profile');

  return { summary };
}

// ── Clear ────────────────────────────────────────────────────────────────────

export async function clearAllLocalData(): Promise<void> {
  await localRepository.clearAll();
}
