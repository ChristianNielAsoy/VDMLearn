import { describe, it, expect, beforeEach } from 'vitest';
import type { MistakeEntry, MistakeReason } from '@/types/notes';

// In-memory fake — no Dexie, no IndexedDB
function makeFakeRepo() {
  let nextId = 1;
  const store: MistakeEntry[] = [];

  return {
    appendMistakeEntry(entry: Omit<MistakeEntry, 'id'>): Promise<number> {
      const id = nextId++;
      store.push({ ...entry, id });
      return Promise.resolve(id);
    },
    getMistakeEntries(since?: number): Promise<MistakeEntry[]> {
      const result = since !== undefined ? store.filter((e) => e.ts >= since) : [...store];
      return Promise.resolve(result);
    },
    getMistakeEntriesForQuestion(questionId: string): Promise<MistakeEntry[]> {
      return Promise.resolve(store.filter((e) => e.questionId === questionId));
    },
    deleteMistakeEntry(id: number): Promise<void> {
      const idx = store.findIndex((e) => e.id === id);
      if (idx !== -1) store.splice(idx, 1);
      return Promise.resolve();
    },
    clearMistakeEntries(): Promise<void> {
      store.splice(0, store.length);
      return Promise.resolve();
    },
  };
}

describe('MistakeJournal repository', () => {
  let repo: ReturnType<typeof makeFakeRepo>;

  beforeEach(() => {
    repo = makeFakeRepo();
  });

  it('appendMistakeEntry returns an auto-increment id', async () => {
    const id1 = await repo.appendMistakeEntry({ questionId: 'q1', reason: 'careless', ts: 1000 });
    const id2 = await repo.appendMistakeEntry({ questionId: 'q2', reason: 'misread', ts: 2000 });
    expect(id1).toBe(1);
    expect(id2).toBe(2);
  });

  it('getMistakeEntries returns all entries when no since filter', async () => {
    await repo.appendMistakeEntry({ questionId: 'q1', reason: 'careless', ts: 1000 });
    await repo.appendMistakeEntry({ questionId: 'q2', reason: 'knowledge-gap', ts: 2000 });
    const all = await repo.getMistakeEntries();
    expect(all).toHaveLength(2);
  });

  it('getMistakeEntries filters by since timestamp (inclusive)', async () => {
    await repo.appendMistakeEntry({ questionId: 'q1', reason: 'careless', ts: 1000 });
    await repo.appendMistakeEntry({ questionId: 'q2', reason: 'misread', ts: 3000 });
    await repo.appendMistakeEntry({ questionId: 'q3', reason: 'mixed-up', ts: 5000 });
    const result = await repo.getMistakeEntries(3000);
    expect(result).toHaveLength(2);
    expect(result.every((e) => e.ts >= 3000)).toBe(true);
  });

  it('getMistakeEntriesForQuestion filters by questionId', async () => {
    await repo.appendMistakeEntry({ questionId: 'q1', reason: 'careless', ts: 1000 });
    await repo.appendMistakeEntry({ questionId: 'q2', reason: 'misread', ts: 2000 });
    await repo.appendMistakeEntry({ questionId: 'q1', reason: 'knowledge-gap', ts: 3000 });
    const result = await repo.getMistakeEntriesForQuestion('q1');
    expect(result).toHaveLength(2);
    expect(result.every((e) => e.questionId === 'q1')).toBe(true);
  });

  it('deleteMistakeEntry removes the entry by id', async () => {
    const id = await repo.appendMistakeEntry({ questionId: 'q1', reason: 'careless', ts: 1000 });
    await repo.deleteMistakeEntry(id);
    const all = await repo.getMistakeEntries();
    expect(all).toHaveLength(0);
  });

  it('clearMistakeEntries removes all entries', async () => {
    await repo.appendMistakeEntry({ questionId: 'q1', reason: 'careless', ts: 1000 });
    await repo.appendMistakeEntry({ questionId: 'q2', reason: 'misread', ts: 2000 });
    await repo.clearMistakeEntries();
    const all = await repo.getMistakeEntries();
    expect(all).toHaveLength(0);
  });

  it('entries preserve optional detail field', async () => {
    await repo.appendMistakeEntry({ questionId: 'q1', reason: 'knowledge-gap', ts: 1000, detail: 'forgot the mechanism' });
    const all = await repo.getMistakeEntries();
    expect(all[0]?.detail).toBe('forgot the mechanism');
  });

  it('entries without detail have no detail property', async () => {
    await repo.appendMistakeEntry({ questionId: 'q1', reason: 'careless', ts: 1000 });
    const all = await repo.getMistakeEntries();
    expect(all[0]?.detail).toBeUndefined();
  });

  it('all four MistakeReason values are accepted', async () => {
    const reasons: MistakeReason[] = ['knowledge-gap', 'misread', 'careless', 'mixed-up'];
    for (const reason of reasons) {
      await repo.appendMistakeEntry({ questionId: 'q1', reason, ts: Date.now() });
    }
    const all = await repo.getMistakeEntries();
    expect(all).toHaveLength(4);
    const storedReasons = all.map((e) => e.reason);
    for (const reason of reasons) {
      expect(storedReasons).toContain(reason);
    }
  });
});
