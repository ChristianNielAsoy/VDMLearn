<template>
  <q-page class="q-pa-md" style="max-width: 600px; margin: 0 auto">
    <div class="text-h6 q-mb-xs">Calculators</div>
    <div class="text-caption text-grey-6 q-mb-md">
      Study aid only — not a substitute for clinical judgement. Formulas shown with every result;
      verify source before use.
    </div>

    <q-banner rounded dense class="text-caption bg-amber-1 text-amber-9 q-mb-md">
      <template #avatar><q-icon name="warning" color="amber-7" /></template>
      These calculators are for <b>study purposes only</b>. Never use for actual clinical decisions.
    </q-banner>

    <q-card class="dvmr-card">
      <q-list separator>
        <q-item
          v-for="calc in calculators"
          :key="calc.id"
          clickable
          v-ripple
          @click="router.push(`/calculators/${calc.id}`)"
        >
          <q-item-section avatar>
            <q-icon :name="calcIcon(calc.id)" color="primary" />
          </q-item-section>
          <q-item-section>
            <q-item-label class="text-body2 text-weight-medium">{{ calc.name }}</q-item-label>
            <q-item-label caption class="text-grey-6">{{ calc.description }}</q-item-label>
            <q-item-label caption>
              <q-badge v-if="calc.verified" color="positive" label="verified" size="xs" />
              <q-badge v-else color="warning" label="unverified" size="xs" />
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-icon name="chevron_right" color="grey-4" />
          </q-item-section>
        </q-item>
      </q-list>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { ALL_CALCULATORS } from '@/services/calculators/index';

const router = useRouter();
const calculators = ALL_CALCULATORS;

function calcIcon(id: string): string {
  const icons: Record<string, string> = {
    'drug-dose': 'vaccines',
    'fluid-therapy': 'water_drop',
    'pearson-square': 'agriculture',
    'epi-2x2': 'biotech',
    'epi-odds': 'bar_chart',
  };
  return icons[id] ?? 'calculate';
}
</script>
