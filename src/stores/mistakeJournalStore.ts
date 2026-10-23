import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { localRepository } from '@/db/repository';
import type { MistakeEntry, MistakeReason } from '@/types/notes';

export const useMistakeJournalStore = defineStore('mistakeJournal', () => {
  const entries = ref<MistakeEntry[]>([]);
  const loading = ref(false);

  const byQuestion = computed(() => {
    const map = new Map<string, MistakeEntry[]>();
    for (const e of entries.value) {
      const arr = map.get(e.questionId) ?? [];
      arr.push(e);
      map.set(e.questionId, arr);
    }
    return map;
  });

  const reasonCounts = computed(() => {
    const counts: Record<MistakeReason, number> = {
      'knowledge-gap': 0,
      misread: 0,
      careless: 0,
      'mixed-up': 0,
    };
    for (const e of entries.value) {
      counts[e.reason] = (counts[e.reason] ?? 0) + 1;
    }
    return counts;
  });

  async function load(since?: number) {
    loading.value = true;
    try {
      entries.value = await localRepository.getMistakeEntries(since);
    } finally {
      loading.value = false;
    }
  }

  async function addEntry(
    questionId: string,
    reason: MistakeReason,
    detail?: string,
    reviewEventId?: number,
  ): Promise<void> {
    const entry: Omit<MistakeEntry, 'id'> = { questionId, reason, ts: Date.now() };
    if (detail !== undefined) entry.detail = detail;
    if (reviewEventId !== undefined) entry.reviewEventId = reviewEventId;
    const id = await localRepository.appendMistakeEntry(entry);
    entries.value.push({ ...entry, id });
  }

  async function removeEntry(id: number): Promise<void> {
    await localRepository.deleteMistakeEntry(id);
    entries.value = entries.value.filter((e) => e.id !== id);
  }

  async function clearAll(): Promise<void> {
    await localRepository.clearMistakeEntries();
    entries.value = [];
  }

  function getForQuestion(questionId: string): MistakeEntry[] {
    return byQuestion.value.get(questionId) ?? [];
  }

  return { entries, loading, byQuestion, reasonCounts, load, addEntry, removeEntry, clearAll, getForQuestion };
});
