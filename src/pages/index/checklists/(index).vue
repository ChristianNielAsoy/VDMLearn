<template>
  <q-page class="q-pa-md" style="max-width: 600px; margin: 0 auto">
    <div class="text-h6 q-mb-xs">Skills Checklists</div>
    <div class="text-caption text-grey-6 q-mb-md">
      Step-through practical skills. Mark each step as you practice.
    </div>

    <q-card class="dvmr-card">
      <q-list separator>
        <q-item
          v-for="cl in checklists"
          :key="cl.id"
          clickable
          v-ripple
          @click="router.push(`/checklists/${cl.id}`)"
        >
          <q-item-section>
            <q-item-label class="text-body2 text-weight-medium">{{ cl.name }}</q-item-label>
            <q-item-label caption class="text-grey-6">{{ cl.steps.length }} steps</q-item-label>
            <q-linear-progress
              v-if="progressFor(cl.id) > 0"
              :value="progressFor(cl.id)"
              color="positive"
              track-color="grey-2"
              rounded
              size="4px"
              class="q-mt-xs"
            />
          </q-item-section>
          <q-item-section side>
            <div class="column items-end q-gutter-xs">
              <q-badge
                v-if="ratingFor(cl.id) > 0"
                :color="ratingColor(ratingFor(cl.id))"
                :label="ratingLabel(ratingFor(cl.id))"
                size="xs"
              />
              <q-icon name="chevron_right" color="grey-4" />
            </div>
          </q-item-section>
        </q-item>
      </q-list>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { CHECKLISTS } from '@/data/checklists/index';
import { localRepository } from '@/db/repository';
import type { ChecklistProgress } from '@/types/checklist';

const router = useRouter();
const checklists = CHECKLISTS;
const progressMap = ref<Map<string, ChecklistProgress>>(new Map());

function progressFor(id: string): number {
  const p = progressMap.value.get(id);
  if (!p) return 0;
  const cl = checklists.find((c) => c.id === id);
  if (!cl || cl.steps.length === 0) return 0;
  return p.stepsDone.length / cl.steps.length;
}

function ratingFor(id: string): number {
  return progressMap.value.get(id)?.selfRating ?? 0;
}

function ratingColor(r: number): string {
  if (r === 3) return 'positive';
  if (r === 2) return 'warning';
  return 'negative';
}

function ratingLabel(r: number): string {
  return ['', 'Needs work', 'OK', 'Competent'][r] ?? '';
}

onMounted(async () => {
  const all = await localRepository.getAllChecklistProgress();
  progressMap.value = new Map(all.map((p) => [p.checklistId, p]));
});
</script>
