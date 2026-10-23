import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Question, ChoiceKey } from '@/types/question';
import { isCorrect } from '@/types/question';
import { localRepository } from '@/db/repository';
import { computeNextReview } from '@/services/srs';
import { mcqActivity } from '@/activities/mcq';

export interface QuizScope {
  type: 'competency' | 'course' | 'due' | 'bookmarked' | 'mock';
  label: string;
  competencyId?: string;
  school?: string;
  year?: number;
  semester?: number;
  courseName?: string;
  timeLimitSeconds?: number;
}

export const useQuizStore = defineStore('quiz', () => {
  const queue = ref<Question[]>([]);
  const currentIndex = ref(0);
  const selectedChoice = ref<ChoiceKey | null>(null);
  const answered = ref(false);
  const scope = ref<QuizScope | null>(null);
  const sessionResults = ref<{ questionId: string; correct: boolean }[]>([]);
  const sessionId = ref<string>(crypto.randomUUID());
  const questionStartMs = ref<number>(Date.now());

  const currentQuestion = computed(() => queue.value[currentIndex.value] ?? null);
  const isLastQuestion = computed(() => currentIndex.value >= queue.value.length - 1);
  const isFinished = computed(
    () => currentIndex.value >= queue.value.length && queue.value.length > 0,
  );
  const sessionScore = computed(() => sessionResults.value.filter((r) => r.correct).length);

  function startQuiz(questions: Question[], quizScope: QuizScope) {
    queue.value = [...questions];
    currentIndex.value = 0;
    selectedChoice.value = null;
    answered.value = false;
    scope.value = quizScope;
    sessionResults.value = [];
    sessionId.value = crypto.randomUUID();
    questionStartMs.value = Date.now();
  }

  async function submitAnswer(choice: ChoiceKey) {
    const q = currentQuestion.value;
    if (!q || answered.value) return;

    const startMs = questionStartMs.value;
    selectedChoice.value = choice;
    answered.value = true;

    const correct = isCorrect(choice, q.answer);
    sessionResults.value.push({ questionId: q.id, correct });

    await localRepository.saveAttempt(q.id, choice, correct);

    const prev = await localRepository.getProgress(q.id);
    const next = computeNextReview(prev ?? null, q.id, correct);
    await localRepository.upsertProgress(next);

    const gradeResult = mcqActivity.grade(q, choice, startMs);
    const event = mcqActivity.toEvent(q, gradeResult, {
      sessionId: sessionId.value,
      mode: scope.value?.type ?? 'competency',
      ts: Date.now(),
    });
    await localRepository.appendReviewEvent(event);
  }

  function next() {
    if (!answered.value) return;
    currentIndex.value++;
    selectedChoice.value = null;
    answered.value = false;
    questionStartMs.value = Date.now();
  }

  function reset() {
    queue.value = [];
    currentIndex.value = 0;
    selectedChoice.value = null;
    answered.value = false;
    scope.value = null;
    sessionResults.value = [];
    sessionId.value = crypto.randomUUID();
    questionStartMs.value = Date.now();
  }

  return {
    queue,
    currentIndex,
    selectedChoice,
    answered,
    scope,
    sessionResults,
    sessionId,
    currentQuestion,
    isLastQuestion,
    isFinished,
    sessionScore,
    startQuiz,
    submitAnswer,
    next,
    reset,
  };
});
