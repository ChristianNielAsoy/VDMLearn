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
  // Waiting for confidence tap before revealing feedback
  const awaitingConfidence = ref(false);
  const scope = ref<QuizScope | null>(null);
  const sessionResults = ref<{ questionId: string; correct: boolean }[]>([]);
  // Items to re-queue at session end (high-confidence wrong answers)
  const retestQueue = ref<Question[]>([]);
  const sessionId = ref<string>(crypto.randomUUID());
  const questionStartMs = ref<number>(Date.now());
  // Confidence tap: 1=Not sure, 2=OK (default), 3=Confident
  const pendingConfidence = ref<1 | 2 | 3>(2);
  // Pending review event built in _doSubmit, written in next() with final confidence
  const pendingEvent = ref<ReviewEvent | null>(null);

  const currentQuestion = computed(() => queue.value[currentIndex.value] ?? null);
  const isLastQuestion = computed(
    () => currentIndex.value >= queue.value.length - 1 && retestQueue.value.length === 0,
  );
  const isFinished = computed(
    () => currentIndex.value >= queue.value.length && queue.value.length > 0,
  );
  const sessionScore = computed(() => sessionResults.value.filter((r) => r.correct).length);
  // Questions answered incorrectly this session (for Retry Missed)
  const missedQuestions = computed(() =>
    sessionResults.value
      .filter((r) => !r.correct)
      .map((r) => queue.value.find((q) => q.id === r.questionId))
      .filter((q): q is Question => q !== undefined),
  );

  function startQuiz(questions: Question[], quizScope: QuizScope) {
    queue.value = [...questions];
    currentIndex.value = 0;
    selectedChoice.value = null;
    answered.value = false;
    awaitingConfidence.value = false;
    scope.value = quizScope;
    sessionResults.value = [];
    retestQueue.value = [];
    sessionId.value = crypto.randomUUID();
    questionStartMs.value = Date.now();
    pendingConfidence.value = 2;
    pendingEvent.value = null;
  }

  // ── Core submit logic ──────────────────────────────────────────────────────

  async function _doSubmit(choice: ChoiceKey, confidence: 1 | 2 | 3) {
    const q = currentQuestion.value;
    if (!q || answered.value) return;

    const startMs = questionStartMs.value;
    selectedChoice.value = choice;
    answered.value = true;
    pendingConfidence.value = confidence;

    const correct = isCorrect(choice, q.answer);
    sessionResults.value.push({ questionId: q.id, correct });

    await localRepository.saveAttempt(q.id, choice, correct);

    const gradeResult = mcqActivity.grade(q, choice, startMs);

    const scheduler = getActiveScheduler();
    const prevProgress = await localRepository.getProgress(q.id);
    const prevState = prevProgress ? scheduler.fromLegacyProgress(prevProgress) : null;
    const nextState = scheduler.computeNextState(
      prevState,
      { objectId: q.id, rating: gradeResult.rating },
      Date.now(),
    );
    await localRepository.upsertProgress(scheduler.toSrsProgress(nextState));

    pendingEvent.value = mcqActivity.toEvent(q, gradeResult, {
      sessionId: sessionId.value,
      mode: scope.value?.type ?? 'competency',
      ts: Date.now(),
    });
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Select a choice. If showConfidenceTap is true, waits for confirmWithConfidence()
   * before revealing feedback. Otherwise submits immediately with confidence=2.
   */
  function selectChoice(choice: ChoiceKey, showConfidenceTap: boolean) {
    const q = currentQuestion.value;
    if (!q || answered.value || awaitingConfidence.value) return;

    selectedChoice.value = choice;

    if (showConfidenceTap) {
      awaitingConfidence.value = true;
    } else {
      void _doSubmit(choice, 2);
    }
  }

  /** Confirm the pending choice with a confidence rating; reveals feedback. */
  async function confirmWithConfidence(confidence: 1 | 2 | 3) {
    if (!awaitingConfidence.value || !selectedChoice.value) return;
    awaitingConfidence.value = false;
    await _doSubmit(selectedChoice.value, confidence);
  }

  /** Direct submit — bypasses confidence tap (used by timer expiry, backward compat). */
  async function submitAnswer(choice: ChoiceKey, confidence: 1 | 2 | 3 = 2) {
    if (awaitingConfidence.value) awaitingConfidence.value = false;
    await _doSubmit(choice, confidence);
  }

  function setConfidence(confidence: 1 | 2 | 3) {
    pendingConfidence.value = confidence;
    if (pendingEvent.value) {
      pendingEvent.value = { ...pendingEvent.value, confidence };
    }
  }

  async function next() {
    if (!answered.value) return;

    // Track high-confidence wrong answers for retest
    const lastResult = sessionResults.value[sessionResults.value.length - 1];
    const q = currentQuestion.value;
    if (lastResult && q && pendingConfidence.value === 3 && !lastResult.correct) {
      if (!retestQueue.value.find((r) => r.id === q.id)) {
        retestQueue.value.push(q);
      }
    }

    // Write review event with final confidence
    if (pendingEvent.value) {
      const event: ReviewEvent = { ...pendingEvent.value, confidence: pendingConfidence.value };
      await localRepository.appendReviewEvent(event);
      pendingEvent.value = null;
    }

    // If at the end of original queue, append retest items
    if (currentIndex.value >= queue.value.length - 1 && retestQueue.value.length > 0) {
      queue.value = [...queue.value, ...retestQueue.value];
      retestQueue.value = [];
    }

    currentIndex.value++;
    selectedChoice.value = null;
    answered.value = false;
    awaitingConfidence.value = false;
    questionStartMs.value = Date.now();
    pendingConfidence.value = 2;
  }

  /** Schedule next-day retest for high-confidence wrong items after session ends. */
  async function scheduleRetests(itemIds: string[]) {
    if (itemIds.length === 0) return;
    const tomorrow = Date.now() + 24 * 60 * 60 * 1000;
    for (const id of itemIds) {
      const progress = await localRepository.getProgress(id);
      if (progress) {
        // Only override if next scheduled interval is > 1 day (don't pull back closer cards)
        const computedInterval = progress.intervalDays ?? 0;
        if (computedInterval > 1 || progress.dueAt > tomorrow) {
          await localRepository.upsertProgress({ ...progress, dueAt: tomorrow });
        }
      }
    }
  }

  function reset() {
    queue.value = [];
    currentIndex.value = 0;
    selectedChoice.value = null;
    answered.value = false;
    awaitingConfidence.value = false;
    scope.value = null;
    sessionResults.value = [];
    retestQueue.value = [];
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
    awaitingConfidence,
    scope,
    sessionResults,
    missedQuestions,
    retestQueue,
    sessionId,
    currentQuestion,
    isLastQuestion,
    isFinished,
    sessionScore,
    pendingConfidence,
    pendingEvent,
    startQuiz,
    selectChoice,
    confirmWithConfidence,
    submitAnswer,
    setConfidence,
    scheduleRetests,
    next,
    reset,
  };
});
