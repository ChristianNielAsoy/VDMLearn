<template>
  <q-page class="column" style="max-width: 600px; margin: 0 auto">

    <div class="row items-center q-px-md q-pt-md q-pb-sm">
      <q-btn flat round dense icon="arrow_back" color="grey-7" @click="router.back()" />
      <div class="col q-ml-sm">
        <div v-if="cl" class="text-body2 text-weight-medium">{{ cl.name }}</div>
        <div v-else class="text-body2 text-grey-5">Not found</div>
      </div>
      <div v-if="cl" class="text-caption text-grey-6">{{ doneCount }}/{{ cl.steps.length }}</div>
    </div>

    <q-separator />

    <div v-if="!cl" class="text-center text-grey-5 q-pa-xl">
      Checklist not found.
    </div>

    <div v-else class="q-pa-md column q-gutter-md">

      <!-- Progress bar -->
      <q-linear-progress
        :value="doneCount / cl.steps.length"
        color="positive"
        track-color="grey-2"
        rounded
        size="8px"
      />

      <!-- Source -->
      <div class="text-caption text-grey-5">
        <q-icon name="menu_book" size="xs" class="q-mr-xs" />{{ cl.source }}
      </div>

      <!-- Steps -->
      <q-card class="dvmr-card">
        <q-list dense>
          <q-item
            v-for="step in cl.steps"
            :key="step.id"
            clickable
            @click="toggleStep(step.id)"
            :class="isDone(step.id) ? 'bg-green-1' : ''"
          >
            <q-item-section avatar style="min-width: 32px">
              <q-checkbox
                :model-value="isDone(step.id)"
                color="positive"
                dense
                @update:model-value="toggleStep(step.id)"
                @click.stop
              />
            </q-item-section>
            <q-item-section>
              <q-item-label
                class="text-body2"
                :class="isDone(step.id) ? 'text-grey-5' : ''"
                style="white-space: normal"
              >{{ step.text }}</q-item-label>
              <q-item-label v-if="step.note" caption class="text-grey-6">{{ step.note }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card>

      <!-- Self-rating -->
      <q-card class="dvmr-card q-pa-md">
        <div class="text-subtitle2 text-grey-7 q-mb-sm">Self-rating</div>
        <div class="row q-gutter-sm">
          <q-btn
            v-for="opt in RATINGS"
            :key="opt.value"
            :label="opt.label"
            :color="selfRating === opt.value ? opt.color : 'grey-3'"
            :text-color="selfRating === opt.value ? 'white' : 'grey-7'"
            unelevated no-caps dense
            @click="setSelfRating(opt.value as 1 | 2 | 3)"
          />
        </div>
      </q-card>

      <!-- Actions -->
      <div class="row q-gutter-sm">
        <q-btn
          flat no-caps color="negative" label="Reset"
          @click="resetProgress"
        />
        <q-space />
        <q-btn
          unelevated no-caps color="primary" label="Save"
          @click="save"
        />
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import { getChecklist } from '@/data/checklists/index';
import { localRepository } from '@/db/repository';
import type { ChecklistProgress } from '@/types/checklist';

const RATINGS = [
  { value: 1, label: 'Needs work', color: 'negative' },
  { value: 2, label: 'OK', color: 'warning' },
  { value: 3, label: 'Competent', color: 'positive' },
];

const router = useRouter();
const route = useRoute();
const $q = useQuasar();

const clId = (route.params as { id: string }).id;
const cl = getChecklist(clId);

const stepsDone = ref<Set<string>>(new Set());
const selfRating = ref<0 | 1 | 2 | 3>(0);

const doneCount = computed(() => stepsDone.value.size);

function isDone(stepId: string): boolean {
  return stepsDone.value.has(stepId);
}

function toggleStep(stepId: string) {
  if (stepsDone.value.has(stepId)) {
    stepsDone.value.delete(stepId);
  } else {
    stepsDone.value.add(stepId);
  }
}

function setSelfRating(r: 1 | 2 | 3) {
  selfRating.value = selfRating.value === r ? 0 : r;
}

async function save() {
  if (!cl) return;
  const progress: ChecklistProgress = {
    checklistId: cl.id,
    stepsDone: [...stepsDone.value],
    selfRating: selfRating.value,
    lastPracticedAt: Date.now(),
  };
  await localRepository.saveChecklistProgress(progress);
  $q.notify({ type: 'positive', message: 'Progress saved', timeout: 1500, position: 'top' });
}

function resetProgress() {
  stepsDone.value = new Set();
  selfRating.value = 0;
}

onMounted(async () => {
  if (!cl) return;
  const saved = await localRepository.getChecklistProgress(cl.id);
  if (saved) {
    stepsDone.value = new Set(saved.stepsDone);
    selfRating.value = saved.selfRating;
  }
});
</script>
