<template>
  <q-page class="column" style="max-width: 720px; margin: 0 auto">

    <div class="q-px-md q-pt-md q-pb-sm">
      <div class="text-h6">Virtual Patient Cases</div>
      <div class="text-caption text-grey-6 q-mt-xs">
        Work through clinical scenarios step by step. Make decisions, collect data, and reach a diagnosis.
      </div>
    </div>

    <div class="q-px-md q-pb-md">
      <q-card
        v-for="c in cases"
        :key="c.id"
        class="dvmr-card q-mb-sm"
        clickable
        v-ripple
        @click="router.push(`/cases/${c.id}`)"
        style="cursor: pointer"
      >
        <q-card-section class="q-pb-xs">
          <div class="row items-start no-wrap">
            <div class="col">
              <div class="text-body2 text-weight-medium">{{ c.title }}</div>
              <div class="text-caption text-grey-7 q-mt-xs">{{ c.description }}</div>
            </div>
            <div class="q-ml-sm">
              <q-icon name="chevron_right" color="grey-4" size="sm" />
            </div>
          </div>
        </q-card-section>

        <q-card-section class="q-pt-xs">
          <div class="row items-center q-gutter-xs">
            <q-badge outline color="primary" :label="c.species" />
            <q-badge
              v-for="cid in c.competencyIds.slice(0, 2)"
              :key="cid"
              outline
              color="grey-6"
              :label="shortCompetency(cid)"
              class="text-caption"
            />
            <q-badge outline color="positive" label="verified" v-if="c.verified" />
          </div>

          <div class="row items-center q-mt-sm text-caption text-grey-6">
            <q-icon name="hub" size="xs" class="q-mr-xs" />
            {{ decisionCount(c) }} decision{{ decisionCount(c) !== 1 ? 's' : '' }}
            &nbsp;·&nbsp;
            <q-icon name="star" size="xs" class="q-mr-xs" />
            {{ c.maxScore }} pts max

            <template v-if="bestSessionMap[c.id] !== undefined">
              &nbsp;·&nbsp;
              <q-icon name="emoji_events" size="xs" color="amber" class="q-mr-xs" />
              Best: {{ bestSessionMap[c.id] }} / {{ c.maxScore }}
            </template>
          </div>
        </q-card-section>
      </q-card>

      <div v-if="cases.length === 0" class="text-center text-grey-5 q-pa-xl">
        No cases available yet.
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { CASES } from '@/data/cases/index';
import type { CaseDef } from '@/types/case';
import { localRepository } from '@/db/repository';

const router = useRouter();
const cases: CaseDef[] = CASES;

const bestSessionMap = ref<Record<string, number>>({});

function shortCompetency(id: string): string {
  const parts = id.split(':');
  return parts[1] ?? parts[0] ?? id;
}

function decisionCount(c: CaseDef): number {
  return c.nodes.filter((n) => n.kind === 'decision').length;
}

onMounted(async () => {
  const sessions = await localRepository.getAllCaseSessions();
  const map: Record<string, number> = {};
  for (const s of sessions) {
    if (s.completedAt === undefined) continue;
    if (map[s.caseId] === undefined || s.score > map[s.caseId]!) {
      map[s.caseId] = s.score;
    }
  }
  bestSessionMap.value = map;
});
</script>
