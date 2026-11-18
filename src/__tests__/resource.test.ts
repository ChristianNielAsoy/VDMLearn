import { describe, it, expect, beforeEach } from 'vitest';
import type { ResourceEntry, ResourceType } from '@/types/resource';

function makeFakeRepo() {
  let nextId = 1;
  const entries: ResourceEntry[] = [];

  return {
    addResource(entry: Omit<ResourceEntry, 'id'>): Promise<number> {
      const id = nextId++;
      entries.push({ ...entry, id });
      return Promise.resolve(id);
    },
    getResourcesForCompetency(competencyId: string): Promise<ResourceEntry[]> {
      return Promise.resolve(entries.filter((r) => r.competencyId === competencyId));
    },
    deleteResource(id: number): Promise<void> {
      const idx = entries.findIndex((r) => r.id === id);
      if (idx !== -1) entries.splice(idx, 1);
      return Promise.resolve();
    },
  };
}

function makeEntry(
  competencyId: string,
  type: ResourceType = 'reference',
): Omit<ResourceEntry, 'id'> {
  return {
    competencyId,
    url: 'https://example.com',
    sourceName: 'Test Source',
    licenseNote: 'Free',
    type,
    addedAt: Date.now(),
  };
}

describe('resource repository', () => {
  let repo: ReturnType<typeof makeFakeRepo>;

  beforeEach(() => {
    repo = makeFakeRepo();
  });

  it('adds a resource and returns an id', async () => {
    const id = await repo.addResource(makeEntry('Veterinary Anatomy:A.1'));
    expect(typeof id).toBe('number');
    expect(id).toBeGreaterThan(0);
  });

  it('retrieves resources by competencyId', async () => {
    await repo.addResource(makeEntry('Anatomy:A.1'));
    await repo.addResource(makeEntry('Anatomy:A.2'));
    await repo.addResource(makeEntry('Physiology:B.1'));

    const anat = await repo.getResourcesForCompetency('Anatomy:A.1');
    expect(anat).toHaveLength(1);
    expect(anat[0]!.competencyId).toBe('Anatomy:A.1');
  });

  it('returns empty array for unknown competencyId', async () => {
    const result = await repo.getResourcesForCompetency('Unknown:Z.99');
    expect(result).toHaveLength(0);
  });

  it('deletes a resource by id', async () => {
    const id = await repo.addResource(makeEntry('Anatomy:A.1'));
    await repo.deleteResource(id);
    const result = await repo.getResourcesForCompetency('Anatomy:A.1');
    expect(result).toHaveLength(0);
  });

  it('deleting non-existent id does not throw', async () => {
    await expect(repo.deleteResource(9999)).resolves.toBeUndefined();
  });

  it('stores verifiedBy field when present', async () => {
    const entry = { ...makeEntry('Anatomy:A.1'), verifiedBy: 'alice' };
    const id = await repo.addResource(entry);
    const results = await repo.getResourcesForCompetency('Anatomy:A.1');
    const saved = results.find((r) => r.id === id);
    expect(saved?.verifiedBy).toBe('alice');
  });

  it('supports all resource types', async () => {
    const types: ResourceType[] = ['atlas', 'reference', 'video', 'course', 'article'];
    for (const type of types) {
      await repo.addResource(makeEntry('Anatomy:A.1', type));
    }
    const results = await repo.getResourcesForCompetency('Anatomy:A.1');
    expect(results).toHaveLength(types.length);
    expect(results.map((r) => r.type)).toEqual(expect.arrayContaining(types));
  });
});
