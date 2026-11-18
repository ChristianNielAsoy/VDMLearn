import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Dexie so tests run without IndexedDB
vi.mock('@/db/dexie', () => {
  const store: Array<Record<string, unknown>> = [];
  let nextId = 1;
  return {
    db: {
      usageLog: {
        add: vi.fn((entry: Record<string, unknown>) => {
          entry.id = nextId++;
          store.push({ ...entry });
          return Promise.resolve(entry.id);
        }),
        orderBy: vi.fn(() => ({
          toArray: vi.fn(() => Promise.resolve([...store])),
        })),
        clear: vi.fn(() => { store.splice(0); return Promise.resolve(); }),
      },
    },
  };
});

import { logFeatureOpen, logSessionStart, logSessionEnd, getAllLogEntries, exportUsageLogJson, clearUsageLog } from '@/services/usageLog';

describe('usageLog service', () => {
  beforeEach(async () => {
    await clearUsageLog();
    vi.clearAllMocks();
  });

  it('logFeatureOpen writes a feature_open entry with correct shape', async () => {
    await logFeatureOpen('quiz');
    const entries = await getAllLogEntries();
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ kind: 'feature_open', feature: 'quiz' });
    expect(typeof entries[0]!.ts).toBe('number');
  });

  it('logSessionStart writes a session_start entry', async () => {
    await logSessionStart('mock');
    const entries = await getAllLogEntries();
    expect(entries[0]).toMatchObject({ kind: 'session_start', feature: 'mock' });
  });

  it('logSessionEnd writes a session_end entry with stats', async () => {
    await logSessionEnd('competency', 10, 7, 300_000);
    const entries = await getAllLogEntries();
    expect(entries[0]).toMatchObject({
      kind: 'session_end',
      feature: 'competency',
      items: 10,
      correct: 7,
      durationMs: 300_000,
    });
  });

  it('exportUsageLogJson produces parseable JSON with entries array', async () => {
    await logFeatureOpen('lessons');
    await logSessionEnd('due', 5, 4, 120_000);
    const json = await exportUsageLogJson();
    const parsed = JSON.parse(json) as { exportedAt: number; entries: unknown[] };
    expect(parsed).toHaveProperty('exportedAt');
    expect(Array.isArray(parsed.entries)).toBe(true);
    expect(parsed.entries).toHaveLength(2);
  });
});
