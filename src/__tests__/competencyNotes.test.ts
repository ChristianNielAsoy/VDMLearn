import { describe, it, expect, beforeEach } from 'vitest';
import type { CompetencyNote, ClozeCard, BlurtSession } from '@/types/notes';

// In-memory fake
function makeFakeRepo() {
  let nextClozeId = 1;
  let nextBlurtId = 1;
  const notes = new Map<string, CompetencyNote>();
  const clozeCards: ClozeCard[] = [];
  const blurtSessions: BlurtSession[] = [];

  return {
    async getCompetencyNote(competencyId: string): Promise<CompetencyNote | undefined> {
      return notes.get(competencyId);
    },
    async saveCompetencyNote(competencyId: string, bodyMd: string): Promise<void> {
      notes.set(competencyId, { competencyId, bodyMd, updatedAt: Date.now() });
    },
    async getAllCompetencyNotes(): Promise<CompetencyNote[]> {
      return [...notes.values()];
    },
    async deleteCompetencyNote(competencyId: string): Promise<void> {
      notes.delete(competencyId);
    },

    async appendClozeCard(card: Omit<ClozeCard, 'id'>): Promise<number> {
      const id = nextClozeId++;
      clozeCards.push({ ...card, id });
      return id;
    },
    async getClozeCardsForCompetency(competencyId: string): Promise<ClozeCard[]> {
      return clozeCards.filter((c) => c.competencyId === competencyId);
    },
    async getAllClozeCards(): Promise<ClozeCard[]> {
      return [...clozeCards];
    },
    async deleteClozeCard(id: number): Promise<void> {
      const idx = clozeCards.findIndex((c) => c.id === id);
      if (idx !== -1) clozeCards.splice(idx, 1);
    },
    async clearClozeCardsForCompetency(competencyId: string): Promise<void> {
      const toRemove = clozeCards.filter((c) => c.competencyId === competencyId).map((c) => c.id);
      for (const id of toRemove) {
        const idx = clozeCards.findIndex((c) => c.id === id);
        if (idx !== -1) clozeCards.splice(idx, 1);
      }
    },

    async appendBlurtSession(session: Omit<BlurtSession, 'id'>): Promise<number> {
      const id = nextBlurtId++;
      blurtSessions.push({ ...session, id });
      return id;
    },
    async getBlurtSessionsForCompetency(competencyId: string): Promise<BlurtSession[]> {
      return blurtSessions.filter((s) => s.competencyId === competencyId);
    },
    async getBlurtSessions(since?: number): Promise<BlurtSession[]> {
      if (since !== undefined) return blurtSessions.filter((s) => s.ts >= since);
      return [...blurtSessions];
    },
  };
}

describe('CompetencyNote repository', () => {
  let repo: ReturnType<typeof makeFakeRepo>;

  beforeEach(() => {
    repo = makeFakeRepo();
  });

  it('saves and retrieves a note', async () => {
    await repo.saveCompetencyNote('Veterinary Anatomy:A.1', '# Osteology');
    const note = await repo.getCompetencyNote('Veterinary Anatomy:A.1');
    expect(note?.bodyMd).toBe('# Osteology');
    expect(note?.competencyId).toBe('Veterinary Anatomy:A.1');
  });

  it('overwrite-saves (upsert) for same competencyId', async () => {
    await repo.saveCompetencyNote('Veterinary Anatomy:A.1', 'first');
    await repo.saveCompetencyNote('Veterinary Anatomy:A.1', 'second');
    const all = await repo.getAllCompetencyNotes();
    expect(all).toHaveLength(1);
    expect(all[0]?.bodyMd).toBe('second');
  });

  it('getAllCompetencyNotes returns all notes', async () => {
    await repo.saveCompetencyNote('Veterinary Anatomy:A.1', 'note A');
    await repo.saveCompetencyNote('Veterinary Physiology:B.1', 'note B');
    const all = await repo.getAllCompetencyNotes();
    expect(all).toHaveLength(2);
  });

  it('deleteCompetencyNote removes the note', async () => {
    await repo.saveCompetencyNote('Veterinary Anatomy:A.1', 'note');
    await repo.deleteCompetencyNote('Veterinary Anatomy:A.1');
    const note = await repo.getCompetencyNote('Veterinary Anatomy:A.1');
    expect(note).toBeUndefined();
  });

  it('getCompetencyNote returns undefined for unknown id', async () => {
    const note = await repo.getCompetencyNote('nonexistent:X.1');
    expect(note).toBeUndefined();
  });
});

describe('ClozeCard repository', () => {
  let repo: ReturnType<typeof makeFakeRepo>;

  beforeEach(() => {
    repo = makeFakeRepo();
  });

  it('appendClozeCard assigns auto-increment id', async () => {
    const id1 = await repo.appendClozeCard({ competencyId: 'Veterinary Anatomy:A.1', front: 'The _____ is the longest bone.', back: 'femur', source: 'note-highlight', createdAt: 1000 });
    const id2 = await repo.appendClozeCard({ competencyId: 'Veterinary Anatomy:A.1', front: 'The _____ is the largest bone.', back: 'pelvis', source: 'manual', createdAt: 2000 });
    expect(id1).toBe(1);
    expect(id2).toBe(2);
  });

  it('getClozeCardsForCompetency filters by competencyId', async () => {
    await repo.appendClozeCard({ competencyId: 'Veterinary Anatomy:A.1', front: 'front1', back: 'back1', source: 'note-highlight', createdAt: 1000 });
    await repo.appendClozeCard({ competencyId: 'Veterinary Physiology:B.1', front: 'front2', back: 'back2', source: 'manual', createdAt: 2000 });
    const cards = await repo.getClozeCardsForCompetency('Veterinary Anatomy:A.1');
    expect(cards).toHaveLength(1);
    expect(cards[0]?.front).toBe('front1');
  });

  it('getAllClozeCards returns all cards', async () => {
    await repo.appendClozeCard({ competencyId: 'c:1', front: 'f1', back: 'b1', source: 'note-highlight', createdAt: 1000 });
    await repo.appendClozeCard({ competencyId: 'c:2', front: 'f2', back: 'b2', source: 'manual', createdAt: 2000 });
    const all = await repo.getAllClozeCards();
    expect(all).toHaveLength(2);
  });

  it('deleteClozeCard removes by id', async () => {
    const id = await repo.appendClozeCard({ competencyId: 'c:1', front: 'f', back: 'b', source: 'note-highlight', createdAt: 1000 });
    await repo.deleteClozeCard(id);
    const all = await repo.getAllClozeCards();
    expect(all).toHaveLength(0);
  });

  it('clearClozeCardsForCompetency removes only that competency cards', async () => {
    await repo.appendClozeCard({ competencyId: 'c:1', front: 'f1', back: 'b1', source: 'note-highlight', createdAt: 1000 });
    await repo.appendClozeCard({ competencyId: 'c:1', front: 'f2', back: 'b2', source: 'note-highlight', createdAt: 2000 });
    await repo.appendClozeCard({ competencyId: 'c:2', front: 'f3', back: 'b3', source: 'manual', createdAt: 3000 });
    await repo.clearClozeCardsForCompetency('c:1');
    const all = await repo.getAllClozeCards();
    expect(all).toHaveLength(1);
    expect(all[0]?.competencyId).toBe('c:2');
  });
});

describe('BlurtSession repository', () => {
  let repo: ReturnType<typeof makeFakeRepo>;

  beforeEach(() => {
    repo = makeFakeRepo();
  });

  it('appendBlurtSession returns auto-increment id', async () => {
    const id1 = await repo.appendBlurtSession({ competencyId: 'c:1', selfScore: 2, ts: 1000 });
    const id2 = await repo.appendBlurtSession({ competencyId: 'c:1', selfScore: 3, ts: 2000 });
    expect(id1).toBe(1);
    expect(id2).toBe(2);
  });

  it('getBlurtSessionsForCompetency filters correctly', async () => {
    await repo.appendBlurtSession({ competencyId: 'c:1', selfScore: 1, ts: 1000 });
    await repo.appendBlurtSession({ competencyId: 'c:2', selfScore: 3, ts: 2000 });
    await repo.appendBlurtSession({ competencyId: 'c:1', selfScore: 2, ts: 3000 });
    const sessions = await repo.getBlurtSessionsForCompetency('c:1');
    expect(sessions).toHaveLength(2);
    expect(sessions.every((s) => s.competencyId === 'c:1')).toBe(true);
  });

  it('getBlurtSessions(since) filters by timestamp (inclusive)', async () => {
    await repo.appendBlurtSession({ competencyId: 'c:1', selfScore: 1, ts: 1000 });
    await repo.appendBlurtSession({ competencyId: 'c:1', selfScore: 2, ts: 5000 });
    await repo.appendBlurtSession({ competencyId: 'c:1', selfScore: 3, ts: 8000 });
    const result = await repo.getBlurtSessions(5000);
    expect(result).toHaveLength(2);
    expect(result.every((s) => s.ts >= 5000)).toBe(true);
  });

  it('getBlurtSessions with no filter returns all', async () => {
    await repo.appendBlurtSession({ competencyId: 'c:1', selfScore: 1, ts: 1000 });
    await repo.appendBlurtSession({ competencyId: 'c:2', selfScore: 3, ts: 2000 });
    const all = await repo.getBlurtSessions();
    expect(all).toHaveLength(2);
  });

  it('selfScore values 1, 2, 3 are all accepted', async () => {
    await repo.appendBlurtSession({ competencyId: 'c:1', selfScore: 1, ts: 1000 });
    await repo.appendBlurtSession({ competencyId: 'c:1', selfScore: 2, ts: 2000 });
    await repo.appendBlurtSession({ competencyId: 'c:1', selfScore: 3, ts: 3000 });
    const all = await repo.getBlurtSessions();
    expect(all.map((s) => s.selfScore).sort()).toEqual([1, 2, 3]);
  });
});
