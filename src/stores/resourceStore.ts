import { defineStore } from 'pinia';
import { ref } from 'vue';
import { localRepository } from '@/db/repository';
import type { ResourceEntry, ResourceType } from '@/types/resource';

export const useResourceStore = defineStore('resource', () => {
  const byCompetency = ref<Map<string, ResourceEntry[]>>(new Map());

  async function loadForCompetency(competencyId: string): Promise<void> {
    const entries = await localRepository.getResourcesForCompetency(competencyId);
    byCompetency.value.set(competencyId, entries);
  }

  function getResources(competencyId: string): ResourceEntry[] {
    return byCompetency.value.get(competencyId) ?? [];
  }

  async function addResource(
    competencyId: string,
    url: string,
    sourceName: string,
    licenseNote: string,
    type: ResourceType,
    verifiedBy?: string,
  ): Promise<void> {
    const entry: Omit<ResourceEntry, 'id'> = {
      competencyId,
      url,
      sourceName,
      licenseNote,
      type,
      addedAt: Date.now(),
      ...(verifiedBy !== undefined ? { verifiedBy } : {}),
    };
    const id = await localRepository.addResource(entry);
    const arr = byCompetency.value.get(competencyId) ?? [];
    arr.push({ ...entry, id });
    byCompetency.value.set(competencyId, arr);
  }

  async function deleteResource(competencyId: string, id: number): Promise<void> {
    await localRepository.deleteResource(id);
    const arr = (byCompetency.value.get(competencyId) ?? []).filter((r) => r.id !== id);
    byCompetency.value.set(competencyId, arr);
  }

  return { byCompetency, loadForCompetency, getResources, addResource, deleteResource };
});
