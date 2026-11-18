<template>
  <q-page class="column" style="max-width: 600px; margin: 0 auto">
    <div class="row items-center q-px-md q-pt-md q-pb-sm">
      <q-btn flat round dense icon="arrow_back" color="grey-7" @click="router.back()" />
      <div class="col q-ml-sm">
        <div v-if="calc" class="text-body2 text-weight-medium">{{ calc.name }}</div>
        <div v-else class="text-body2 text-grey-5">Calculator not found</div>
      </div>
      <q-badge v-if="calc?.verified" color="positive" label="verified" />
      <q-badge v-else-if="calc" color="warning" label="unverified" />
    </div>

    <q-separator />

    <div v-if="!calc" class="text-center text-grey-5 q-pa-xl">
      <q-icon name="calculate" size="3rem" color="grey-3" />
      <div class="q-mt-sm">Calculator not found.</div>
    </div>

    <div v-else class="q-pa-md column q-gutter-md">
      <!-- Disclaimer -->
      <q-banner rounded dense class="text-caption bg-amber-1 text-amber-9">
        <template #avatar><q-icon name="warning" color="amber-7" /></template>
        Study aid only — not for clinical use.
      </q-banner>

      <!-- Description -->
      <div class="text-caption text-grey-7">{{ calc.description }}</div>

      <!-- Inputs -->
      <q-card class="dvmr-card q-pa-md">
        <div class="text-subtitle2 text-grey-7 q-mb-sm">Inputs</div>
        <div class="column q-gutter-sm">
          <div v-for="field in calc.fields" :key="field.key" class="row items-center q-gutter-sm">
            <q-input
              v-model.number="inputs[field.key]"
              :label="`${field.label} (${field.unit})`"
              type="number"
              :min="field.min"
              :max="field.max"
              :step="field.step ?? 1"
              dense
              outlined
              class="col"
              @update:model-value="compute"
            />
          </div>
        </div>
        <q-btn
          unelevated
          no-caps
          color="primary"
          label="Calculate"
          class="q-mt-md full-width"
          @click="compute"
        />
      </q-card>

      <!-- Results -->
      <template v-if="results.length > 0">
        <q-card class="dvmr-card q-pa-md">
          <div class="text-subtitle2 text-grey-7 q-mb-sm">Results</div>
          <div v-for="r in results" :key="r.key" class="q-mb-sm">
            <div class="row items-baseline q-gutter-xs">
              <div class="col text-body2">{{ r.label }}</div>
              <div class="text-h6 text-primary text-weight-bold">
                {{ isFinite(r.value) ? r.value : '∞' }}
                <span class="text-caption text-grey-6 text-weight-regular q-ml-xs">{{
                  r.unit
                }}</span>
              </div>
            </div>
            <div class="text-caption text-grey-5 q-mt-xs">{{ r.formula }}</div>
            <q-separator class="q-mt-xs" />
          </div>
        </q-card>
      </template>

      <!-- Source -->
      <div class="text-caption text-grey-5 q-pt-xs">
        <q-icon name="menu_book" size="xs" class="q-mr-xs" />{{ calc.source }}
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { getCalculator } from '@/services/calculators/index';
import type { CalculatorResult } from '@/types/calculator';

const router = useRouter();
const route = useRoute();

const calcId = (route.params as { id: string }).id;
const calc = getCalculator(calcId);

const inputs = reactive<Record<string, number>>({});
const results = ref<CalculatorResult[]>([]);

function compute() {
  if (!calc) return;
  results.value = calc.compute({ ...inputs });
}

onMounted(() => {
  if (!calc) return;
  for (const field of calc.fields) {
    inputs[field.key] = field.defaultValue ?? 0;
  }
  compute();
});
</script>
