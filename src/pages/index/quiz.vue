<template>
  <q-page class="q-pa-md column" style="max-width: 720px; margin: 0 auto">

    <!-- ── Empty state ──────────────────────────────────────────────── -->
    <div v-if="!quizStore.currentQuestion && !quizStore.isFinished" class="text-center q-mt-xl q-py-xl">
      <div class="empty-icon-wrap q-mx-auto q-mb-lg">
        <q-icon name="quiz" size="2.5rem" color="grey-5" />
      </div>
      <div class="text-h6 text-weight-semibold q-mb-xs" style="letter-spacing: -0.01em">No active quiz</div>
      <div class="text-body2 text-grey-6 q-mb-xl">Go to Browse or Mock and tap a topic to start.</div>
      <div class="q-gutter-sm">
        <q-btn color="primary" label="Browse Topics" to="/" no-caps unelevated style="min-height: 40px; border-radius: 8px" />
        <q-btn outline color="primary" label="Mock Exam" to="/mock" no-caps style="min-height: 40px; border-radius: 8px" />
      </div>
    </div>

    <!-- ── Finished state ────────────────────────────────────────────── -->
    <div v-else-if="quizStore.isFinished || timer.expired.value" class="text-center q-mt-xl">
      <div
        class="score-icon-wrap q-mx-auto q-mb-md"
        :class="timer.expired.value && !quizStore.isFinished ? 'score-icon-warn' : 'score-icon-pass'"
      >
        <q-icon
          :name="timer.expired.value && !quizStore.isFinished ? 'timer_off' : 'check_circle'"
          size="2.5rem"
          color="white"
        />
      </div>
      <div class="text-h6 text-weight-semibold q-mb-sm" style="letter-spacing: -0.01em">
        {{ timer.expired.value && !quizStore.isFinished ? "Time's Up!" : 'Quiz Complete!' }}
      </div>
      <div class="text-h2 text-primary text-weight-bold q-mb-xs" style="letter-spacing: -0.03em; line-height: 1">
        {{ quizStore.sessionScore }}
        <span class="text-h4 text-grey-5">/{{ quizStore.sessionResults.length }}</span>
      </div>
      <div class="text-body1 text-grey-6 q-mb-xl">
        {{ pct(quizStore.sessionScore, quizStore.sessionResults.length) }}% correct
        <span v-if="timer.expired.value && !quizStore.isFinished" class="text-caption">
          ({{ quizStore.queue.length - quizStore.sessionResults.length }} unanswered)
        </span>
      </div>
      <div class="q-gutter-sm">
        <q-btn color="primary" label="Back to Browse" to="/" no-caps unelevated style="min-height: 40px; border-radius: 8px" @click="quizStore.reset()" />
        <q-btn outline color="primary" label="New Mock" to="/mock" no-caps style="min-height: 40px; border-radius: 8px" @click="quizStore.reset()" />
      </div>
    </div>

    <!-- ── Active quiz ────────────────────────────────────────────────── -->
    <template v-else-if="quizStore.currentQuestion">

      <!-- Timer banner (mock mode) -->
      <div
        v-if="quizStore.scope?.type === 'mock'"
        class="timer-banner q-mb-sm row items-center justify-center"
        :class="
          timer.remaining.value < 300 ? 'timer-danger'
          : timer.remaining.value < 900 ? 'timer-warn'
          : 'timer-ok'
        "
      >
        <q-icon name="timer" size="xs" class="q-mr-xs" />
        <span class="text-weight-bold font-mono">{{ timer.display.value }}</span>
        <span class="text-caption q-ml-sm opacity-70">remaining</span>
      </div>

      <!-- Progress -->
      <div class="q-mb-md">
        <div class="row justify-between items-center q-mb-xs">
          <span class="text-caption text-grey-6">
            Question {{ quizStore.currentIndex + 1 }} of {{ quizStore.queue.length }}
          </span>
          <div class="row items-center q-gutter-xs">
            <span v-if="quizStore.scope" class="text-caption text-grey-6 ellipsis" style="max-width: 160px">
              {{ quizStore.scope.label }}
            </span>
            <q-btn
              flat round dense
              :icon="isBookmarked ? 'bookmark' : 'bookmark_border'"
              :color="isBookmarked ? 'amber-7' : 'grey-4'"
              size="sm"
              @click="toggleBookmark"
            />
          </div>
        </div>
        <q-linear-progress
          :value="(quizStore.currentIndex + (quizStore.answered ? 1 : 0)) / quizStore.queue.length"
          color="primary"
          track-color="grey-2"
          rounded
          size="8px"
          class="dvmr-progress"
        />
      </div>

      <!-- Unverified badge -->
      <q-chip
        v-if="quizStore.currentQuestion.status !== 'verified'"
        icon="warning"
        color="orange-1"
        text-color="orange-9"
        dense
        class="q-mb-sm"
        size="sm"
        style="border: 1px solid #fed7aa"
      >
        Unverified — not peer-reviewed
      </q-chip>

      <!-- Stem card -->
      <div class="stem-card q-mb-md">
        <p class="text-body1 q-ma-none" style="line-height: 1.7">
          {{ quizStore.currentQuestion.stem }}
        </p>
      </div>

      <!-- Choices -->
      <div class="q-gutter-sm q-mb-md">
        <q-btn
          v-for="choice in quizStore.currentQuestion.choices"
          :key="choice.key"
          :label="`${choice.key}.  ${choice.text}`"
          :aria-label="`Choice ${choice.key}: ${choice.text}`"
          :color="choiceColor(choice.key)"
          :text-color="choiceTextColor(choice.key)"
          :outline="choiceOutline(choice.key)"
          unelevated
          no-caps
          align="left"
          class="full-width choice-btn"
          style="min-height: 48px; padding: 10px 16px; text-align: left"
          :disable="quizStore.answered || timer.expired.value"
          @click="submitAnswer(choice.key)"
        />
      </div>

      <!-- Feedback -->
      <transition name="slide-down">
        <div v-if="quizStore.answered" class="feedback-card q-mb-md">
          <div class="row items-center q-mb-sm">
            <q-icon
              :name="isCorrect ? 'check_circle' : 'cancel'"
              :color="isCorrect ? 'positive' : 'negative'"
              size="sm"
              class="q-mr-xs"
            />
            <span
              class="text-weight-semibold"
              :class="isCorrect ? 'text-positive' : 'text-negative'"
            >
              {{ isCorrect ? 'Correct!' : `Incorrect — answer is ${quizStore.currentQuestion.answer}` }}
            </span>
          </div>
          <p class="text-body2 q-mb-sm q-ma-none" style="line-height: 1.65">
            {{ quizStore.currentQuestion.explanation }}
          </p>
          <div class="row items-center justify-between q-mt-xs">
            <div class="text-caption text-grey-5 row items-center">
              <q-icon name="source" size="xs" class="q-mr-xs" />
              {{ quizStore.currentQuestion.source }}
            </div>
            <q-btn
              flat dense round
              :icon="isFlagged ? 'flag' : 'flag_outlined'"
              :color="isFlagged ? 'negative' : 'grey-4'"
              size="sm"
              :aria-label="isFlagged ? 'Remove flag' : 'Flag question'"
              @click="toggleFlag"
            >
              <q-tooltip>{{ isFlagged ? 'Flagged for review' : 'Flag this question' }}</q-tooltip>
            </q-btn>
          </div>
          <div v-if="quizStore.currentQuestion.notes" class="notes-banner q-mt-sm">
            <q-icon name="lightbulb" color="amber-7" size="xs" class="q-mr-xs" />
            <span class="text-caption">{{ quizStore.currentQuestion.notes }}</span>
          </div>
        </div>
      </transition>

      <!-- Confidence tap -->
      <transition name="slide-down">
        <div v-if="quizStore.answered" class="confidence-row q-mb-sm">
          <div class="text-caption text-grey-6 q-mb-xs text-center">How confident were you?</div>
          <div class="row q-gutter-xs justify-center">
            <q-btn
              v-for="(label, conf) in CONFIDENCE_LABELS"
              :key="conf"
              :label="label"
              :color="quizStore.pendingConfidence === conf + 1 ? 'primary' : 'grey-2'"
              :text-color="quizStore.pendingConfidence === conf + 1 ? 'white' : 'grey-7'"
              unelevated
              no-caps
              size="sm"
              style="min-height: 36px; flex: 1"
              @click="quizStore.setConfidence((conf + 1) as 1 | 2 | 3)"
            />
          </div>
        </div>
      </transition>

      <!-- Next / Finish -->
      <q-btn
        v-if="quizStore.answered"
        :label="quizStore.isLastQuestion ? 'Finish Quiz' : 'Next Question →'"
        color="primary"
        unelevated
        no-caps
        class="full-width"
        style="min-height: 48px; border-radius: 8px; font-weight: 600"
        @click="advanceNext()"
      />
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { computed, watch, onMounted } from 'vue';
import { useQuizStore } from '@/stores/quizStore';
import { useProgressStore } from '@/stores/progressStore';
import { useTimer } from '@/composables/useTimer';
import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts';
import type { ChoiceKey } from '@/types/question';

const CONFIDENCE_LABELS = ['Not sure', 'OK', 'Confident'] as const;

const quizStore = useQuizStore();
const progressStore = useProgressStore();

const timeLimitSeconds = computed(() => quizStore.scope?.timeLimitSeconds ?? 0);
const timer = useTimer(timeLimitSeconds.value);

watch(
  () => quizStore.scope?.type,
  (type) => {
    if (type === 'mock' && timeLimitSeconds.value > 0) {
      timer.reset(timeLimitSeconds.value);
      timer.start();
    } else {
      timer.stop();
    }
  },
  { immediate: true },
);

onMounted(() => {
  if (quizStore.scope?.type === 'mock' && timeLimitSeconds.value > 0) {
    timer.reset(timeLimitSeconds.value);
    timer.start();
  }
});

const isBookmarked = computed(() => {
  const q = quizStore.currentQuestion;
  return q ? progressStore.bookmarkedIds.includes(q.id) : false;
});

const isFlagged = computed(() => {
  const q = quizStore.currentQuestion;
  return q ? progressStore.flaggedIds.includes(q.id) : false;
});

const isCorrect = computed(
  () => quizStore.selectedChoice === quizStore.currentQuestion?.answer,
);

function toggleBookmark() {
  const q = quizStore.currentQuestion;
  if (!q) return;
  void progressStore.toggleBookmark(q.id);
}

function toggleFlag() {
  const q = quizStore.currentQuestion;
  if (!q) return;
  void progressStore.toggleFlag(q.id);
}

function submitAnswer(choice: ChoiceKey) {
  void quizStore.submitAnswer(choice);
}

function advanceNext() {
  void quizStore.next();
}

// Keyboard shortcuts: 1-4 → choice A-D; Space/Enter → next
const KEYS: ChoiceKey[] = ['A', 'B', 'C', 'D'];
useKeyboardShortcuts({
  onChoiceKey(index) {
    const q = quizStore.currentQuestion;
    if (!q || quizStore.answered) return;
    const key = KEYS[index];
    if (key && q.choices.some((c) => c.key === key)) submitAnswer(key);
  },
  onConfirm() {
    if (quizStore.answered) advanceNext();
  },
});

function pct(n: number, total: number): number {
  return total > 0 ? Math.round((n / total) * 100) : 0;
}

function choiceColor(key: ChoiceKey): string {
  if (!quizStore.answered) return 'grey-1';
  const q = quizStore.currentQuestion;
  if (!q) return 'grey-1';
  if (key === q.answer) return 'positive';
  if (key === quizStore.selectedChoice) return 'negative';
  return 'grey-1';
}

function choiceTextColor(key: ChoiceKey): string {
  if (!quizStore.answered) return 'grey-9';
  const q = quizStore.currentQuestion;
  if (!q) return 'grey-9';
  if (key === q.answer) return 'white';
  if (key === quizStore.selectedChoice) return 'white';
  return 'grey-6';
}

function choiceOutline(key: ChoiceKey): boolean {
  if (!quizStore.answered) return true;
  const q = quizStore.currentQuestion;
  if (!q) return true;
  return key !== q.answer && key !== quizStore.selectedChoice;
}
</script>

<style scoped>
/* ── Empty / score icon wrappers ──────────────────────────────── */
.empty-icon-wrap {
  width: 72px;
  height: 72px;
  border-radius: 20px;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
}

.score-icon-wrap {
  width: 72px;
  height: 72px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.score-icon-pass { background: #10b981; }
.score-icon-warn { background: #f59e0b; }

/* ── Timer banner ─────────────────────────────────────────────── */
.timer-banner {
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 0.875rem;
}
.timer-ok     { background: #ecfdf5; color: #065f46; }
.timer-warn   { background: #fffbeb; color: #92400e; }
.timer-danger { background: #fef2f2; color: #991b1b; }

/* ── Stem card ────────────────────────────────────────────────── */
.stem-card {
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.07);
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.body--dark .stem-card {
  background: #1e293b;
  border-color: rgba(255, 255, 255, 0.08);
}

/* ── Feedback card ────────────────────────────────────────────── */
.feedback-card {
  background: #f8fafc;
  border: 1px solid rgba(0, 0, 0, 0.07);
  border-radius: 10px;
  padding: 16px 20px;
}

.body--dark .feedback-card {
  background: #1e293b;
  border-color: rgba(255, 255, 255, 0.08);
}

.notes-banner {
  background: #fefce8;
  border: 1px solid #fef08a;
  border-radius: 6px;
  padding: 8px 12px;
  display: flex;
  align-items: flex-start;
}

/* ── Feedback slide-in ────────────────────────────────────────── */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.slide-down-enter-from {
  opacity: 0;
  transform: translateY(-6px);
}
.slide-down-leave-to {
  opacity: 0;
}

.font-mono {
  font-family: 'SF Mono', ui-monospace, monospace;
}

/* ── Confidence tap row ───────────────────────────────────────── */
.confidence-row {
  background: #f8fafc;
  border: 1px solid rgba(0, 0, 0, 0.07);
  border-radius: 10px;
  padding: 10px 12px;
}

.body--dark .confidence-row {
  background: #1e293b;
  border-color: rgba(255, 255, 255, 0.08);
}
</style>
