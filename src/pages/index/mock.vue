<template>
  <q-page class="q-pa-md" style="max-width: 640px; margin: 0 auto">
    <div class="text-h6 q-mb-xs">Mock Board Exam</div>
    <div class="text-caption text-grey q-mb-md">
      PRC format · 100 items per subject ·
      {{ onboardingStore.mockDurationMinutes }} min per block
      <q-badge color="warning" label="duration unverified" size="xs" class="q-ml-xs" />
    </div>

    <q-banner rounded dense class="text-caption bg-amber-1 text-amber-9 q-mb-md">
      <template #avatar>
        <q-icon name="info" color="amber-7" />
      </template>
      For study purposes only — not clinical guidance.
    </q-banner>

    <!-- Day selector -->
    <div class="q-gutter-sm q-mb-lg">
      <q-card
        v-for="day in days"
        :key="day.n"
        flat
        bordered
        clickable
        :class="selected === day.n ? 'bg-primary-1 border-primary' : ''"
        class="cursor-pointer q-pa-sm"
        @click="selected = day.n"
      >
        <q-card-section class="q-py-xs">
          <div class="row items-center">
            <q-radio v-model="selected" :val="day.n" color="primary" dense class="q-mr-sm" />
            <div class="col">
              <div class="text-body2 text-weight-medium">Day {{ day.n }}</div>
              <div class="text-caption text-grey">{{ day.subjects.join(' · ') }}</div>
            </div>
            <div class="text-right">
              <div class="text-body2 text-weight-bold text-primary">
                {{ dayQuestionCount(day.subjects) }}
              </div>
              <div class="text-caption text-grey">/ {{ day.subjects.length * 100 }} q</div>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Subject breakdown for selected day -->
    <div v-if="selected" class="q-mb-lg">
      <div class="text-caption text-weight-medium text-grey-7 q-mb-xs">SUBJECT BREAKDOWN</div>
      <q-list dense bordered separator rounded>
        <q-item v-for="sub in selectedSubjects" :key="sub" class="q-py-xs">
          <q-item-section>
            <q-item-label class="text-body2">{{ sub }}</q-item-label>
            <q-item-label caption>
              <span
                :class="
                  questionCountBySubject.get(sub) === 0
                    ? 'text-negative'
                    : questionCountBySubject.get(sub)! < 20
                      ? 'text-warning'
                      : 'text-positive'
                "
              >
                {{ questionCountBySubject.get(sub) ?? 0 }} available
              </span>
              of 100 target
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-badge
              v-if="(questionCountBySubject.get(sub) ?? 0) === 0"
              color="grey-4"
              text-color="grey-6"
              label="No questions"
            />
            <q-badge
              v-else-if="(questionCountBySubject.get(sub) ?? 0) < 20"
              color="warning"
              label="Few questions"
            />
            <q-badge v-else color="positive" label="Ready" />
          </q-item-section>
        </q-item>
      </q-list>
    </div>

    <!-- Warning if no questions at all -->
    <q-banner
      v-if="selected && dayQuestionCount(selectedSubjects) === 0"
      rounded
      dense
      class="text-caption bg-red-1 text-negative q-mb-md"
    >
      <template #avatar>
        <q-icon name="warning" color="negative" />
      </template>
      No questions available for Day {{ selected }}. Import questions first.
    </q-banner>

    <!-- Shortfall warning: bank has questions but fewer than the 100-per-subject target -->
    <q-banner
      v-else-if="selected && shortfallCount > 0"
      rounded
      dense
      class="text-caption bg-orange-1 text-orange-9 q-mb-md"
    >
      <template #avatar>
        <q-icon name="info" color="orange-7" />
      </template>
      Bank has {{ dayQuestionCount(selectedSubjects) }} of
      {{ selectedSubjects.length * 100 }} target items — exam will be shorter than a real VMLE.
      Import more questions to reach full coverage.
    </q-banner>

    <!-- Start button -->
    <q-btn
      color="primary"
      unelevated
      no-caps
      class="full-width"
      style="min-height: 48px"
      :disable="!selected || dayQuestionCount(selectedSubjects) === 0"
      @click="startMock"
    >
      <q-icon name="play_arrow" class="q-mr-sm" />
      Start Day {{ selected ?? '?' }} Mock
      <span v-if="selected" class="q-ml-xs text-caption opacity-80">
        ({{ dayQuestionCount(selectedSubjects) }} questions ·
        {{ onboardingStore.mockDurationMinutes }} min)
      </span>
    </q-btn>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuizStore } from '@/stores/quizStore';
import { useQuestionStore } from '@/stores/questionStore';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { DAY_SUBJECTS, drawMockQuestions, subjectQuestionCount } from '@/services/mockDraw';
import { loadTos } from '@/data/loaders/tos';

const tosData = loadTos();
const questionStore = useQuestionStore();
const onboardingStore = useOnboardingStore();
onMounted(() => Promise.all([questionStore.loadAll(), onboardingStore.load()]));
const router = useRouter();
const quizStore = useQuizStore();

const selected = ref<1 | 2 | 3 | null>(null);

const days = ([1, 2, 3] as const).map((n) => ({
  n,
  subjects: DAY_SUBJECTS[n],
}));

const questionCountBySubject = computed(() => subjectQuestionCount(questionStore.questions));

const selectedSubjects = computed(() => (selected.value ? DAY_SUBJECTS[selected.value] : []));

const shortfallCount = computed(() => {
  if (!selected.value) return 0;
  const available = dayQuestionCount(selectedSubjects.value);
  const target = selectedSubjects.value.length * 100;
  return available > 0 && available < target ? target - available : 0;
});

function dayQuestionCount(subjects: string[]): number {
  return subjects.reduce((sum, s) => sum + (questionCountBySubject.value.get(s) ?? 0), 0);
}

function startMock() {
  if (!selected.value) return;
  const subjects = DAY_SUBJECTS[selected.value];
  const questions = drawMockQuestions(subjects, questionStore.questions, tosData);
  if (questions.length === 0) return;

  quizStore.startQuiz(questions, {
    type: 'mock',
    label: `Day ${selected.value} Mock`,
    timeLimitSeconds: onboardingStore.mockDurationMinutes * 60,
  });
  void router.push('/quiz');
}
</script>

<style scoped>
.border-primary {
  border-color: var(--q-primary) !important;
  border-width: 2px !important;
}
.bg-primary-1 {
  background: rgba(var(--q-primary-rgb, 25, 118, 210), 0.06);
}
</style>
