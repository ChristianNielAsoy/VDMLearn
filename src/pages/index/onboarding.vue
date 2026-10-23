<template>
  <q-page class="q-pa-md column items-center justify-center" style="min-height: 80vh">
    <div style="max-width: 420px; width: 100%">

      <!-- Logo + title -->
      <div class="text-center q-mb-xl">
        <div class="text-h5 text-weight-bold text-primary q-mb-xs">Welcome to VDMLearn</div>
        <div class="text-caption text-grey-6">Let's set up your study profile.</div>
      </div>

      <!-- Step indicator -->
      <div class="row justify-center q-mb-lg q-gutter-xs">
        <div
          v-for="n in TOTAL_STEPS"
          :key="n"
          :class="['step-dot', step >= n ? 'step-dot--active' : '']"
        />
      </div>

      <!-- Step 1: Target school -->
      <div v-if="step === 1">
        <div class="text-subtitle1 text-weight-semibold q-mb-md">Which DVM program are you targeting?</div>
        <q-list bordered separator class="dvmr-card q-mb-md">
          <q-item
            v-for="school in SCHOOLS"
            :key="school.value"
            clickable
            v-ripple
            :active="form.targetSchool === school.value"
            active-class="bg-primary-1 text-primary"
            @click="form.targetSchool = school.value"
          >
            <q-item-section>
              <q-item-label>{{ school.label }}</q-item-label>
              <q-item-label caption>{{ school.sub }}</q-item-label>
            </q-item-section>
            <q-item-section side v-if="form.targetSchool === school.value">
              <q-icon name="check_circle" color="primary" />
            </q-item-section>
          </q-item>
        </q-list>
      </div>

      <!-- Step 2: Exam date -->
      <div v-else-if="step === 2">
        <div class="text-subtitle1 text-weight-semibold q-mb-sm">When is your target VMLE?</div>
        <div class="text-caption text-grey-6 q-mb-md">
          The next sitting is tentatively scheduled for November 2026 (verify at prc.gov.ph).
        </div>
        <q-input
          v-model="examDateStr"
          label="Target exam date"
          type="date"
          outlined
          class="q-mb-md"
        />
        <div class="text-caption text-grey-5">
          Leave blank to skip. You can change this in Settings later.
        </div>
      </div>

      <!-- Step 3: Pass rules -->
      <div v-else-if="step === 3">
        <div class="text-subtitle1 text-weight-semibold q-mb-sm">Passing thresholds</div>
        <div class="text-caption text-grey-6 q-mb-md">
          PRC requires a weighted average of 75% with no subject below 60%. Adjust if you want a stricter personal goal.
        </div>

        <q-card class="dvmr-card q-pa-md q-mb-sm">
          <div class="text-caption text-grey-6 q-mb-xs">Overall readiness target: {{ form.passRuleOverallPct }}%</div>
          <q-slider
            v-model="form.passRuleOverallPct"
            :min="60" :max="95" :step="5"
            label
            color="primary"
          />
        </q-card>

        <q-card class="dvmr-card q-pa-md q-mb-md">
          <div class="text-caption text-grey-6 q-mb-xs">Minimum per-subject target: {{ form.passRuleSubjectMinPct }}%</div>
          <q-slider
            v-model="form.passRuleSubjectMinPct"
            :min="40" :max="80" :step="5"
            label
            color="primary"
          />
        </q-card>

        <div class="text-caption text-grey-5">
          These thresholds power the readiness score on your Today screen.
        </div>
      </div>

      <!-- Navigation -->
      <div class="row q-gutter-sm q-mt-lg">
        <q-btn
          v-if="step > 1"
          flat
          color="grey-7"
          no-caps
          label="Back"
          class="col"
          @click="step--"
        />
        <q-btn
          v-if="step < TOTAL_STEPS"
          unelevated
          color="primary"
          no-caps
          :label="step === 1 && !form.targetSchool ? 'Skip' : 'Next'"
          class="col"
          @click="step++"
        />
        <q-btn
          v-else
          unelevated
          color="primary"
          no-caps
          label="Get started"
          class="col"
          :loading="saving"
          @click="finish"
        />
      </div>

      <!-- Skip all -->
      <div class="text-center q-mt-md">
        <q-btn flat dense no-caps color="grey-5" label="Skip setup" size="sm" @click="finish" />
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { usePlannerStore } from '@/stores/plannerStore';
import type { School } from '@/types/question';

const router = useRouter();
const onboardingStore = useOnboardingStore();
const plannerStore = usePlannerStore();

const TOTAL_STEPS = 3;
const step = ref(1);
const saving = ref(false);

const SCHOOLS: { value: School; label: string; sub: string }[] = [
  { value: 'UPLB', label: 'UPLB CVM', sub: 'University of the Philippines Los Baños' },
  { value: 'CLSU', label: 'CLSU CVSM', sub: 'Central Luzon State University' },
  { value: 'PSAU', label: 'PSAU CVM', sub: 'Pampanga State Agricultural University' },
  { value: 'CHED', label: 'Other / National curriculum', sub: 'CHED CMO No. 1, s. 2018' },
];

const form = reactive({
  targetSchool: null as School | null,
  passRuleOverallPct: 75,
  passRuleSubjectMinPct: 60,
});

const examDateStr = ref('2026-11-04');

async function finish() {
  saving.value = true;
  try {
    const updates: Parameters<typeof onboardingStore.saveProfile>[0] = {
      passRuleOverallPct: form.passRuleOverallPct,
      passRuleSubjectMinPct: form.passRuleSubjectMinPct,
      completedAt: Date.now(),
    };
    if (form.targetSchool) updates.targetSchool = form.targetSchool;

    const examTs = examDateStr.value ? new Date(examDateStr.value).getTime() : undefined;
    if (examTs && !isNaN(examTs)) {
      updates.targetExamDate = examTs;
      // Mirror to planner settings so countdown is visible on Today screen
      await plannerStore.load();
      await plannerStore.saveSettings({ ...plannerStore.settings, examDate: examTs });
    }

    await onboardingStore.saveProfile(updates);
    void router.push('/today');
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.step-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #e2e8f0;
  transition: background 0.2s ease, width 0.2s ease;
}
.step-dot--active {
  background: var(--q-primary);
  width: 24px;
}
</style>
