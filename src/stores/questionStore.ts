import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Question } from '@/types/question';
import { loadAllQuestions } from '@/data/loaders/questions';

export const useQuestionStore = defineStore('questions', () => {
  const questions = ref<Question[]>([]);
  const loading = ref(false);
  const loaded = ref(false);

  async function loadAll() {
    if (loaded.value) return;
    loading.value = true;
    try {
      questions.value = await loadAllQuestions();
      loaded.value = true;
    } finally {
      loading.value = false;
    }
  }

  async function reload() {
    loaded.value = false;
    await loadAll();
  }

  return { questions, loading, loaded, loadAll, reload };
});
