<template>
  <div class="step-through column">
    <!-- Progress -->
    <div class="row items-center q-mb-sm">
      <div class="text-caption text-grey-6 col">
        Step {{ currentIndex + 1 }} of {{ def.steps.length }}
      </div>
      <q-btn
        flat
        round
        dense
        icon="close"
        color="grey-5"
        size="sm"
        v-if="$attrs.onClose"
        @click="$emit('close')"
      />
    </div>
    <q-linear-progress
      :value="(currentIndex + 1) / def.steps.length"
      color="primary"
      track-color="grey-2"
      rounded
      size="5px"
      class="q-mb-md"
    />

    <!-- Step content -->
    <q-card class="dvmr-card q-pa-md col step-card">
      <div class="text-subtitle2 text-weight-medium q-mb-sm">{{ step.title }}</div>
      <div class="text-body2 text-grey-8" style="line-height: 1.7; white-space: pre-line">
        {{ step.body }}
      </div>
      <div v-if="step.diagram" class="q-mt-md">
        <MermaidDiagram :diagram="step.diagram" />
      </div>
    </q-card>

    <!-- Navigation -->
    <div class="row items-center q-mt-md q-gutter-sm">
      <q-btn
        flat
        no-caps
        icon="arrow_back"
        label="Previous"
        color="grey-7"
        :disable="currentIndex === 0"
        @click="currentIndex--"
      />
      <q-space />
      <!-- Step dots -->
      <div class="row q-gutter-xs">
        <div
          v-for="(_, i) in def.steps"
          :key="i"
          class="step-dot"
          :class="{ 'step-dot--active': i === currentIndex, 'step-dot--done': i < currentIndex }"
          @click="currentIndex = i"
        />
      </div>
      <q-space />
      <q-btn
        v-if="currentIndex < def.steps.length - 1"
        unelevated
        no-caps
        icon-right="arrow_forward"
        label="Next"
        color="primary"
        @click="currentIndex++"
      />
      <q-btn
        v-else
        unelevated
        no-caps
        icon="check"
        label="Done"
        color="positive"
        @click="$emit('done')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import MermaidDiagram from './MermaidDiagram.vue';
import type { StepperDef } from '@/types/media';

const props = defineProps<{ def: StepperDef }>();
defineEmits<{ close: []; done: [] }>();

const currentIndex = ref(0);
const step = computed(() => props.def.steps[currentIndex.value]!);
</script>

<style scoped>
.step-card {
  min-height: 180px;
}

.step-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #e2e8f0;
  cursor: pointer;
  transition: background 0.15s;
}

.step-dot--active {
  background: var(--q-primary);
  transform: scale(1.3);
}

.step-dot--done {
  background: #93c5fd;
}
</style>
