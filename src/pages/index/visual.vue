<template>
  <q-page class="column" style="max-width: 720px; margin: 0 auto">

    <q-tabs
      v-model="activeTab"
      dense
      align="justify"
      active-color="primary"
      indicator-color="primary"
      class="q-px-md"
      style="border-bottom: 1px solid var(--dvmr-border)"
    >
      <q-tab name="diagrams"  label="Diagrams"    no-caps />
      <q-tab name="lifecycles" label="Life Cycles" no-caps />
    </q-tabs>

    <q-tab-panels v-model="activeTab" animated class="col">

      <!-- ── Hotspot Diagrams ───────────────────────────────── -->
      <q-tab-panel name="diagrams" class="q-pa-md">
        <div class="text-caption text-grey-6 q-mb-md">
          Schematic diagrams (original drawings). Click a diagram to open atlas or label quiz.
        </div>

        <q-card class="dvmr-card">
          <q-list separator>
            <q-item
              v-for="d in hotspots"
              :key="d.id"
              clickable
              v-ripple
              @click="router.push(`/hotspot/${d.id}`)"
            >
              <q-item-section avatar>
                <q-icon name="hub" color="primary" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-body2 text-weight-medium">{{ d.title }}</q-item-label>
                <q-item-label caption class="text-grey-6">{{ d.regions.length }} labeled structures</q-item-label>
              </q-item-section>
              <q-item-section side>
                <div class="row q-gutter-xs">
                  <q-badge color="primary" label="atlas" size="xs" />
                  <q-badge color="orange" label="quiz" size="xs" />
                  <q-icon name="chevron_right" color="grey-4" />
                </div>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </q-tab-panel>

      <!-- ── Life Cycle Steppers ───────────────────────────── -->
      <q-tab-panel name="lifecycles" class="q-pa-md">
        <div class="text-caption text-grey-6 q-mb-md">
          Step-through life cycles and pathogenesis. Tap to open.
        </div>

        <div v-if="activeStepper" class="q-mb-md">
          <StepThrough
            :def="activeStepper"
            @done="activeStepper = null"
            @close="activeStepper = null"
          />
        </div>

        <q-card v-else class="dvmr-card">
          <q-list separator>
            <q-item
              v-for="s in steppers"
              :key="s.id"
              clickable
              v-ripple
              @click="activeStepper = s"
            >
              <q-item-section avatar>
                <q-icon name="loop" color="primary" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-body2 text-weight-medium">{{ s.title }}</q-item-label>
                <q-item-label caption class="text-grey-6">{{ s.steps.length }} steps · {{ s.description }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-icon name="chevron_right" color="grey-4" />
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </q-tab-panel>
    </q-tab-panels>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { HOTSPOT_DIAGRAMS } from '@/data/hotspots/index';
import { STEPPERS } from '@/data/steppers/index';
import StepThrough from '@/components/StepThrough.vue';
import type { StepperDef } from '@/types/media';

const router = useRouter();
const activeTab = ref('diagrams');
const hotspots = HOTSPOT_DIAGRAMS;
const steppers = STEPPERS;
const activeStepper = ref<StepperDef | null>(null);
</script>
