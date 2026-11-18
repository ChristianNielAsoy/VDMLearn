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
      <q-tab name="quickref" label="Quick Ref" no-caps />
      <q-tab name="skilltree" label="Skill Tree" no-caps />
    </q-tabs>

    <q-tab-panels v-model="activeTab" animated class="col">
      <!-- ── Quick Reference ───────────────────────────────────── -->
      <q-tab-panel name="quickref" class="q-pa-md">
        <div class="text-caption text-grey-6 q-mb-md">
          Reference values for study only. Values may vary by source and method. Always check the
          cited source for clinical use.
        </div>

        <!-- Search -->
        <q-input v-model="search" dense outlined placeholder="Search…" clearable class="q-mb-md">
          <template #prepend><q-icon name="search" /></template>
        </q-input>

        <div v-for="card in filteredCards" :key="card.id" class="q-mb-md">
          <div class="row items-center q-mb-xs">
            <div class="text-subtitle2 col">{{ card.title }}</div>
            <q-badge v-if="card.verified" color="positive" label="verified" size="xs" />
            <q-badge v-else color="warning" label="unverified" size="xs" />
          </div>
          <q-card class="dvmr-card">
            <q-list dense separator>
              <q-item v-for="row in card.rows" :key="row.label">
                <q-item-section>
                  <q-item-label class="text-body2">{{ row.label }}</q-item-label>
                  <q-item-label v-if="row.note" caption class="text-grey-5">{{
                    row.note
                  }}</q-item-label>
                </q-item-section>
                <q-item-section side class="text-right">
                  <q-item-label class="text-body2 text-weight-bold">{{ row.value }}</q-item-label>
                  <q-item-label v-if="row.unit" caption class="text-grey-6">{{
                    row.unit
                  }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card>
          <div class="text-caption text-grey-5 q-mt-xs">
            <q-icon name="menu_book" size="xs" /> {{ card.source }}
          </div>
        </div>

        <div v-if="filteredCards.length === 0" class="text-center text-grey-5 q-pa-xl">
          No results for "{{ search }}".
        </div>
      </q-tab-panel>

      <!-- ── Skill Tree ─────────────────────────────────────────── -->
      <q-tab-panel name="skilltree" class="q-pa-md">
        <div class="text-caption text-grey-6 q-mb-md">
          Prerequisite chain for DVM coursework — based on CMO No. 1 s.2018 and PSAU curriculum. Tap
          a node to see what it unlocks.
        </div>

        <div v-for="year in [0, 1, 2, 3, 4]" :key="year" class="q-mb-md">
          <div class="text-subtitle2 text-grey-7 q-mb-xs">
            {{ year === 0 ? 'Pre-DVM (Year 0)' : `Year ${year}` }}
          </div>
          <div class="row q-gutter-sm flex-wrap">
            <div
              v-for="node in nodesByYear(year)"
              :key="node.id"
              class="skill-node cursor-pointer"
              :class="{ 'skill-node--selected': selectedNode?.id === node.id }"
              @click="selectNode(node)"
            >
              <div class="text-body2 text-weight-medium">{{ node.label }}</div>
              <div
                v-if="node.description"
                class="text-caption text-grey-6"
                style="font-size: 0.7rem"
              >
                {{ node.description }}
              </div>
              <div
                v-if="node.prerequisites.length > 0"
                class="q-mt-xs row items-center q-gutter-xs"
              >
                <q-icon name="arrow_upward" size="xs" color="grey-5" />
                <span class="text-caption text-grey-5" style="font-size: 0.65rem">
                  {{ node.prerequisites.join(', ') }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Selected node detail -->
        <q-card v-if="selectedNode" class="dvmr-card q-pa-md q-mt-md">
          <div class="text-subtitle2 q-mb-xs">{{ selectedNode.label }}</div>
          <div class="text-caption text-grey-6 q-mb-sm">{{ selectedNode.description }}</div>
          <template v-if="prereqs.length > 0">
            <div class="text-caption text-grey-5 q-mb-xs">Prerequisites:</div>
            <div class="row q-gutter-xs q-mb-sm">
              <q-chip
                v-for="p in prereqs"
                :key="p.id"
                dense
                color="grey-2"
                text-color="grey-7"
                size="sm"
                >{{ p.label }}</q-chip
              >
            </div>
          </template>
          <template v-if="dependents.length > 0">
            <div class="text-caption text-grey-5 q-mb-xs">Unlocks:</div>
            <div class="row q-gutter-xs">
              <q-chip
                v-for="d in dependents"
                :key="d.id"
                dense
                color="primary"
                text-color="white"
                size="sm"
                >{{ d.label }}</q-chip
              >
            </div>
          </template>
        </q-card>
      </q-tab-panel>
    </q-tab-panels>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { QUICK_REF_CARDS } from '@/data/quickref/index';
import {
  SKILL_TREE_NODES,
  getPrerequisites,
  getDependents,
  getNodesByYear,
} from '@/services/skillTree';
import type { SkillNode } from '@/services/skillTree';

const activeTab = ref('quickref');

// ── Quick ref ─────────────────────────────────────────────────────────
const search = ref('');
const filteredCards = computed(() => {
  if (!search.value.trim()) return QUICK_REF_CARDS;
  const q = search.value.toLowerCase();
  return QUICK_REF_CARDS.filter(
    (c) =>
      c.title.toLowerCase().includes(q) ||
      c.rows.some((r) => r.label.toLowerCase().includes(q) || r.value.toLowerCase().includes(q)),
  );
});

// ── Skill tree ────────────────────────────────────────────────────────
void SKILL_TREE_NODES; // keep import alive
const selectedNode = ref<SkillNode | null>(null);
const prereqs = computed(() => (selectedNode.value ? getPrerequisites(selectedNode.value.id) : []));
const dependents = computed(() => (selectedNode.value ? getDependents(selectedNode.value.id) : []));

function nodesByYear(year: number) {
  return getNodesByYear(year);
}

function selectNode(node: SkillNode) {
  selectedNode.value = selectedNode.value?.id === node.id ? null : node;
}
</script>

<style scoped>
.skill-node {
  background: #f8fafc;
  border: 1px solid var(--dvmr-border);
  border-radius: var(--dvmr-radius-sm);
  padding: 8px 10px;
  min-width: 140px;
  max-width: 200px;
  flex: 0 0 auto;
  transition:
    border-color 0.15s,
    background 0.15s;
}

.skill-node:hover {
  border-color: var(--q-primary);
}

.skill-node--selected {
  border-color: var(--q-primary);
  background: rgba(var(--q-primary-rgb, 25, 118, 210), 0.06);
}
</style>
