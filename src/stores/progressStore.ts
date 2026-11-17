import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { VmleSubject, Question } from '@/types/question';
import { VMLE_SUBJECTS } from '@/types/question';
import { localRepository } from '@/db/repository';
import { useQuestionStore } from '@/stores/questionStore';

export interface SubjectAccuracy {
  subject: VmleSubject;
  attempts: number;
  correct: number;
  pct: number;
}

export const useProgressStore = defineStore('progress', () => {
  const questionStore = useQuestionStore();

  const questionMap = computed(() => new Map(questionStore.questions.map((q) => [q.id, q])));

  const accuracy = ref<SubjectAccuracy[]>([]);
  const dueQuestions = ref<Question[]>([]);
  const bookmarkedIds = ref<string[]>([]);
  const flaggedIds = ref<string[]>([]);
  const loading = ref(false);

  const weakSubjects = computed(() => accuracy.value.filter((a) => a.attempts >= 5 && a.pct < 60));

  const bookmarkedQuestions = computed(() =>
    bookmarkedIds.value.map((id) => questionMap.value.get(id)).filter((q): q is Question => !!q),
  );

  const flaggedQuestions = computed(() =>
    flaggedIds.value.map((id) => questionMap.value.get(id)).filter((q): q is Question => !!q),
  );

  async function refresh() {
    loading.value = true;
    try {
      await questionStore.loadAll();
      await Promise.all([_refreshAccuracy(), _refreshDue(), _refreshBookmarks(), _refreshFlags()]);
    } finally {
      loading.value = false;
    }
  }

  async function _refreshAccuracy() {
    const allAttempts = await localRepository.getAllAttempts();

    const bySubject = new Map<VmleSubject, { attempts: number; correct: number }>();
    for (const subject of VMLE_SUBJECTS) {
      bySubject.set(subject, { attempts: 0, correct: 0 });
    }

    for (const attempt of allAttempts) {
      const q = questionMap.value.get(attempt.questionId);
      if (!q) continue;
      const entry = bySubject.get(q.vmleSubject);
      if (!entry) continue;
      entry.attempts++;
      if (attempt.correct) entry.correct++;
    }

    accuracy.value = VMLE_SUBJECTS.map((subject) => {
      const { attempts, correct } = bySubject.get(subject)!;
      return {
        subject,
        attempts,
        correct,
        pct: attempts > 0 ? Math.round((correct / attempts) * 100) : 0,
      };
    });
  }

  async function _refreshDue() {
    const dueProgress = await localRepository.getDueProgress(Date.now());
    const due = dueProgress
      .map((p) => questionMap.value.get(p.questionId))
      .filter((q): q is Question => !!q);
    dueQuestions.value = due;
  }

  async function _refreshBookmarks() {
    bookmarkedIds.value = await localRepository.getBookmarks();
  }

  async function _refreshFlags() {
    flaggedIds.value = await localRepository.getFlaggedIds();
  }

  async function toggleBookmark(questionId: string) {
    const already = bookmarkedIds.value.includes(questionId);
    if (already) {
      await localRepository.removeBookmark(questionId);
      bookmarkedIds.value = bookmarkedIds.value.filter((id) => id !== questionId);
    } else {
      await localRepository.addBookmark(questionId);
      bookmarkedIds.value = [...bookmarkedIds.value, questionId];
    }
  }

  async function toggleFlag(questionId: string) {
    const already = flaggedIds.value.includes(questionId);
    if (already) {
      await localRepository.removeFlag(questionId);
      flaggedIds.value = flaggedIds.value.filter((id) => id !== questionId);
    } else {
      await localRepository.addFlag(questionId);
      flaggedIds.value = [...flaggedIds.value, questionId];
    }
  }

  return {
    accuracy,
    dueQuestions,
    bookmarkedIds,
    flaggedIds,
    bookmarkedQuestions,
    flaggedQuestions,
    weakSubjects,
    loading,
    refresh,
    toggleBookmark,
    toggleFlag,
  };
});
