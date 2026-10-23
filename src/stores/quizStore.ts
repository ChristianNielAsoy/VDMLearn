import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Question, ChoiceKey } from '@/types/question';
import { isCorrect } from '@/types/question';
import { localRepository } from '@/db/repository';
import { getActiveScheduler } from '@/services/scheduler';
import { mcqActivity } from '@/activities/mcq';
import type { ReviewEvent } from '@/types/review';

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
  // Confidence tap: 1=Not sure, 2=OK (default), 3=Confident
  const pendingConfidence = ref<1 | 2 | 3>(2);
  // Pending review event built in submitAnswer, written in next() with final confidence
  const pendingEvent = ref<ReviewEvent | null>(null);

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
    pendingConfidence.value = 2;
    pendingEvent.value = null;
  }

  async function submitAnswer(choice: ChoiceKey, confidence: 1 | 2 | 3 = 2) {
    const q = currentQuestion.value;
    if (!q || answered.value) return;

    const startMs = questionStartMs.value;
    selectedChoice.value = choice;
    answered.value = true;
    pendingConfidence.value = confidence;

    const correct = isCorrect(choice, q.answer);
    sessionResults.value.push({ questionId: q.id, correct });

    await localRepository.saveAttempt(q.id, choice, correct);

    // Build grade with current confidence (may be updated by confidence tap before next())
    const gradeResult = mcqActivity.grade(q, choice, startMs);

    const scheduler = getActiveScheduler();
    const prevProgress = await localRepository.getProgress(q.id);
    const prevState = prevProgress ? scheduler.fromLegacyProgress(prevProgress) : null;
    const nextState = scheduler.computeNextState(prevState, { objectId: q.id, rating: gradeResult.rating }, Date.now());
    await localRepository.upsertProgress(scheduler.toSrsProgress(nextState));

    // Store the event stub — confidence will be finalized in next() or setConfidence()
    pendingEvent.value = mcqActivity.toEvent(q, gradeResult, {
      sessionId: sessionId.value,
      mode: scope.value?.type ?? 'competency',
      ts: Date.now(),
    });
  }

  function setConfidence(confidence: 1 | 2 | 3) {
    pendingConfidence.value = confidence;
    if (pendingEvent.value) {
      pendingEvent.value = { ...pendingEvent.value, confidence };
    }
  }

  async function next() {
    if (!answered.value) return;

    // Write review event with final confidence
    if (pendingEvent.value) {
      const event: ReviewEvent = { ...pendingEvent.value, confidence: pendingConfidence.value };
      await localRepository.appendReviewEvent(event);
      pendingEvent.value = null;
    }

    currentIndex.value++;
    selectedChoice.value = null;
    answered.value = false;
    questionStartMs.value = Date.now();
    pendingConfidence.value = 2;
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
    pendingConfidence.value = 2;
    pendingEvent.value = null;
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
    pendingConfidence,
    startQuiz,
    submitAnswer,
    setConfidence,
    next,
    reset,
  };
});
