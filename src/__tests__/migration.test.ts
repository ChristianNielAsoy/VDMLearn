import { describe, it, expect } from 'vitest';

// Pure-function mirror of the v8 upgrade callback in src/db/dexie.ts.
// If the dexie.ts upgrade logic changes, update this mirror and re-run.
interface LegacyQuestion {
  id: string;
  competencyId: string;
  competencyIds?: string[];
  updatedAt?: number;
  version?: number;
  [key: string]: unknown;
}

function applyV8Upgrade(q: LegacyQuestion): void {
  if (!q.competencyIds || q.competencyIds.length === 0) {
    q.competencyIds = [q.competencyId];
  }
  if (!q.updatedAt) q.updatedAt = 0;
  if (!q.version) q.version = 1;
}

describe('Dexie v8 upgrade — importedQuestions migration', () => {
  it('synthesises competencyIds from competencyId when missing', () => {
    const row: LegacyQuestion = { id: 'anat-001', competencyId: 'Veterinary Anatomy:A.1.1' };
    applyV8Upgrade(row);
    expect(row.competencyIds).toEqual(['Veterinary Anatomy:A.1.1']);
  });

  it('synthesises competencyIds when present but empty array', () => {
    const row: LegacyQuestion = {
      id: 'anat-002',
      competencyId: 'Veterinary Anatomy:A.1.2',
      competencyIds: [],
    };
    applyV8Upgrade(row);
    expect(row.competencyIds).toEqual(['Veterinary Anatomy:A.1.2']);
  });

  it('leaves competencyIds unchanged when already populated', () => {
    const row: LegacyQuestion = {
      id: 'phys-001',
      competencyId: 'Veterinary Physiology:B.1',
      competencyIds: ['Veterinary Physiology:B.1', 'Veterinary Physiology:B.2'],
    };
    applyV8Upgrade(row);
    expect(row.competencyIds).toEqual(['Veterinary Physiology:B.1', 'Veterinary Physiology:B.2']);
  });

  it('sets updatedAt=0 when missing', () => {
    const row: LegacyQuestion = { id: 'q1', competencyId: 'Veterinary Anatomy:A.1.1' };
    applyV8Upgrade(row);
    expect(row.updatedAt).toBe(0);
  });

  it('leaves updatedAt unchanged when already set', () => {
    const row: LegacyQuestion = {
      id: 'q1',
      competencyId: 'Veterinary Anatomy:A.1.1',
      updatedAt: 1_700_000_000_000,
    };
    applyV8Upgrade(row);
    expect(row.updatedAt).toBe(1_700_000_000_000);
  });

  it('sets version=1 when missing', () => {
    const row: LegacyQuestion = { id: 'q1', competencyId: 'Veterinary Anatomy:A.1.1' };
    applyV8Upgrade(row);
    expect(row.version).toBe(1);
  });

  it('leaves version unchanged when already set', () => {
    const row: LegacyQuestion = { id: 'q1', competencyId: 'Veterinary Anatomy:A.1.1', version: 3 };
    applyV8Upgrade(row);
    expect(row.version).toBe(3);
  });

  it('applies all three fields in a single pass for a legacy row', () => {
    const row: LegacyQuestion = { id: 'para-007', competencyId: 'Veterinary Parasitology:C.3.1' };
    applyV8Upgrade(row);
    expect(row).toMatchObject({
      competencyIds: ['Veterinary Parasitology:C.3.1'],
      updatedAt: 0,
      version: 1,
    });
  });
});
