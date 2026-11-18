import { db } from '@/db/dexie';
import type { UsageLogEntry } from '@/types/usageLog';

export async function logUsage(entry: Omit<UsageLogEntry, 'id'>): Promise<void> {
  await db.usageLog.add(entry);
}

export async function logFeatureOpen(feature: string): Promise<void> {
  await logUsage({ kind: 'feature_open', feature, ts: Date.now() });
}

export async function logSessionStart(mode: string): Promise<void> {
  await logUsage({ kind: 'session_start', feature: mode, ts: Date.now() });
}

export async function logSessionEnd(
  mode: string,
  items: number,
  correct: number,
  durationMs: number,
): Promise<void> {
  await logUsage({
    kind: 'session_end',
    feature: mode,
    ts: Date.now(),
    durationMs,
    items,
    correct,
    mode,
  });
}

export async function getAllLogEntries(): Promise<UsageLogEntry[]> {
  return db.usageLog.orderBy('ts').toArray();
}

export async function exportUsageLogJson(): Promise<string> {
  const entries = await getAllLogEntries();
  return JSON.stringify({ exportedAt: Date.now(), entries }, null, 2);
}

export async function clearUsageLog(): Promise<void> {
  await db.usageLog.clear();
}
