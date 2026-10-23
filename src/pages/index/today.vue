<template>
  <q-page class="q-pa-md">
    <!-- Greeting -->
    <div class="row items-center q-mb-md">
      <div>
        <div class="text-h6 text-weight-semibold">{{ greeting }}</div>
        <div class="text-caption text-grey-6">{{ todayLabel }}</div>
      </div>
      <q-space />
      <q-btn
        flat
        round
        dense
        icon="refresh"
        :loading="loading"
        title="Refresh"
        @click="refresh(true)"
      />
    </div>

    <!-- Due + readiness row -->
    <div class="row q-col-gutter-sm q-mb-sm">
      <!-- Due items card -->
      <div class="col-6">
        <q-card class="dvmr-card q-pa-md text-center">
          <div class="text-h4 text-weight-bold" :class="dueCount > 0 ? 'text-primary' : 'text-grey-5'">
            {{ dueCount }}
          </div>
          <div class="text-caption text-grey-6 q-mt-xs">Due today</div>
          <q-btn
            v-if="dueCount > 0"
            unelevated
            color="primary"
            no-caps
            size="sm"
            label="Start"
            class="q-mt-sm full-width"
            to="/quiz"
          />
        </q-card>
      </div>

      <!-- Readiness ring card -->
      <div class="col-6">
        <q-card class="dvmr-card q-pa-md text-center">
          <q-circular-progress
            :value="readinessPct"
            size="56px"
            :thickness="0.18"
            :color="readinessColor"
            track-color="grey-2"
            show-value
            class="text-weight-bold"
            style="font-size: 13px"
          >
            {{ readinessPct }}%
          </q-circular-progress>
          <div class="text-caption text-grey-6 q-mt-xs">Readiness</div>
          <q-badge
            v-if="report"
            :color="report.meetsOverall ? 'positive' : 'warning'"
            class="q-mt-xs"
            style="font-size: 10px"
          >
            {{ report.meetsOverall ? 'On track' : 'Below target' }}
          </q-badge>
        </q-card>
      </div>
    </div>

    <!-- Exam countdown -->
    <q-card v-if="plannerStore.daysUntilExam !== null" class="dvmr-card q-pa-sm q-mb-sm row items-center">
      <q-icon name="event" color="primary" class="q-mr-sm" />
      <div>
        <span class="text-weight-semibold">{{ plannerStore.daysUntilExam }} days</span>
        <span class="text-grey-6 text-caption q-ml-xs">until VMLE ({{ plannerStore.examDateStr }})</span>
      </div>
    </q-card>

    <!-- Subject mastery list -->
    <div class="text-subtitle2 text-grey-7 q-mb-xs q-mt-md">Subject Readiness</div>

    <div v-if="loading && !report" class="text-center q-pa-lg text-grey-5">
      <q-spinner size="32px" />
    </div>

    <div v-else-if="!report" class="text-caption text-grey-5 text-center q-pa-md">
      Complete a few practice questions to see readiness scores.
    </div>

    <template v-else>
      <q-card
        v-for="sub in report.subjects"
        :key="sub.subject"
        class="dvmr-card q-pa-sm q-mb-xs"
      >
        <div class="row items-center q-mb-xs">
          <div class="text-body2 text-weight-medium col">{{ sub.subject }}</div>
          <div class="text-caption text-grey-6">{{ masteryPct(sub.subjectMastery) }}%</div>
          <q-badge
            :color="sub.meetsSubjectMin ? 'positive' : 'warning'"
            class="q-ml-xs"
            style="font-size: 9px; padding: 2px 5px"
          >
            {{ sub.meetsSubjectMin ? '✓' : '!' }}
          </q-badge>
        </div>
        <q-linear-progress
          :value="sub.subjectMastery"
          :color="masteryColor(sub.subjectMastery)"
          track-color="grey-2"
          rounded
          style="height: 6px"
        />
      </q-card>
    </template>

    <!-- Quick actions -->
    <div class="row q-col-gutter-sm q-mt-md">
      <div class="col-6">
        <q-btn
          unelevated
          color="primary"
          no-caps
          class="full-width"
          icon="quiz"
          label="Practice"
          to="/quiz"
        />
      </div>
      <div class="col-6">
        <q-btn
          outline
          color="primary"
          no-caps
          class="full-width"
          icon="menu_book"
          label="Lessons"
          to="/lessons"
        />
      </div>
    </div>

    <!-- Estimate disclaimer -->
    <div class="text-caption text-grey-5 text-center q-mt-md">
      Readiness scores are estimates based on your practice history.
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useMasteryStore } from '@/stores/masteryStore';
import { useProgressStore } from '@/stores/progressStore';
import { usePlannerStore } from '@/stores/plannerStore';

const masteryStore = useMasteryStore();
const progressStore = useProgressStore();
const plannerStore = usePlannerStore();

const loading = computed(() => masteryStore.loading);
const report = computed(() => masteryStore.report);
const dueCount = computed(() => progressStore.dueQuestions.length);

const readinessPct = computed(() => {
  if (!report.value) return 0;
  return Math.round(report.value.overallReadiness * 100);
});

const readinessColor = computed(() => {
  const pct = readinessPct.value;
  if (pct >= 75) return 'positive';
  if (pct >= 50) return 'warning';
  return 'negative';
});

function masteryPct(val: number): number {
  return Math.round(val * 100);
}

function masteryColor(val: number): string {
  if (val >= 0.75) return 'positive';
  if (val >= 0.5) return 'warning';
  return 'negative';
}

const greeting = computed(() => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
});

const todayLabel = computed(() =>
  new Date().toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric' }),
);

onMounted(async () => {
  await Promise.all([
    progressStore.refresh(),
    masteryStore.refresh(),
    plannerStore.load(),
  ]);
});
</script>
