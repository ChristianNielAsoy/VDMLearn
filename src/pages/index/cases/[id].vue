<template>
  <q-page class="column" style="max-width: 720px; margin: 0 auto">

    <!-- Header -->
    <div class="row items-center q-px-md q-pt-md q-pb-sm">
      <q-btn flat round dense icon="arrow_back" color="grey-7" @click="router.back()" />
      <div class="col q-ml-sm">
        <div v-if="def" class="text-body2 text-weight-medium">{{ def.title }}</div>
        <div v-else class="text-body2 text-grey-5">Case not found</div>
      </div>
      <q-badge v-if="def" outline color="primary" :label="def.species" />
    </div>

    <q-separator />

    <!-- Not found -->
    <div v-if="!def" class="text-center text-grey-5 q-pa-xl">Case not found.</div>

    <!-- DEBRIEF view -->
    <template v-else-if="showDebrief && debrief">
      <div class="q-pa-md column q-gutter-md">
        <!-- Score banner -->
        <q-card class="dvmr-card q-pa-md text-center">
          <q-icon
            :name="debrief.pct >= 80 ? 'emoji_events' : debrief.pct >= 50 ? 'thumb_up' : 'sentiment_dissatisfied'"
            :color="debrief.pct >= 80 ? 'positive' : debrief.pct >= 50 ? 'primary' : 'negative'"
            size="3rem"
          />
          <div class="text-h5 q-mt-sm">{{ debrief.score }} / {{ debrief.maxScore }}</div>
          <div class="text-caption text-grey-6">{{ debrief.pct }}% — {{ scoreLabel(debrief.pct) }}</div>
          <div v-if="debrief.finalDiagnosis" class="q-mt-md text-body2 text-weight-medium">
            Final Diagnosis: {{ debrief.finalDiagnosis }}
          </div>
        </q-card>

        <!-- Decision review -->
        <div class="text-subtitle2 text-grey-7 q-mb-xs">Decision Review</div>
        <q-card
          v-for="d in debrief.decisions"
          :key="d.nodeId"
          class="dvmr-card"
        >
          <q-card-section class="q-pb-xs">
            <div class="row items-center q-gutter-xs">
              <q-icon
                :name="d.correct ? 'check_circle' : 'cancel'"
                :color="d.correct ? 'positive' : 'negative'"
                size="sm"
              />
              <span class="text-body2 text-weight-medium">{{ d.nodeTitle }}</span>
              <q-space />
              <span class="text-caption text-grey-6">{{ d.pointsEarned }} / {{ d.bestPoints }} pts</span>
            </div>
          </q-card-section>
          <q-card-section class="q-pt-xs">
            <div class="text-caption text-grey-7 q-mb-xs">Your answer: <em>{{ d.choiceLabel }}</em></div>
            <div class="text-body2" :class="d.correct ? 'text-positive' : 'text-negative'">
              {{ d.feedback }}
            </div>
          </q-card-section>
        </q-card>

        <!-- Source -->
        <div class="text-caption text-grey-5">
          <q-icon name="menu_book" size="xs" /> {{ def.source }}
        </div>

        <!-- Actions -->
        <div class="row q-gutter-sm">
          <q-btn unelevated no-caps color="primary" icon="replay" label="Play Again" @click="restart" />
          <q-btn flat no-caps color="grey-7" icon="arrow_back" label="All Cases" @click="router.back()" />
        </div>
      </div>
    </template>

    <!-- CASE PLAYER view -->
    <template v-else-if="state">
      <div class="q-pa-md column q-gutter-md">

        <!-- Progress -->
        <div class="row items-center q-gutter-sm">
          <q-linear-progress
            :value="progressPct"
            color="primary"
            track-color="grey-3"
            class="col"
            rounded
            style="height: 6px"
          />
          <span class="text-caption text-grey-6">{{ visitedCount }} / {{ nodeCount }}</span>
        </div>

        <!-- Current node card -->
        <q-card v-if="currentNode" class="dvmr-card">
          <q-card-section class="q-pb-xs">
            <div class="row items-center q-gutter-xs">
              <q-badge :color="kindColor(currentNode.kind)" :label="kindLabel(currentNode.kind)" />
              <span v-if="currentNode.title" class="text-body2 text-weight-medium">{{ currentNode.title }}</span>
            </div>
          </q-card-section>
          <q-card-section>
            <div class="text-body2 case-content" style="white-space: pre-wrap">{{ currentNode.content }}</div>
          </q-card-section>
        </q-card>

        <!-- Choice feedback (shown after selection) -->
        <q-card v-if="lastFeedback !== null" class="dvmr-card q-pa-md">
          <div class="row items-start q-gutter-sm">
            <q-icon
              :name="lastChoiceCorrect ? 'check_circle' : 'cancel'"
              :color="lastChoiceCorrect ? 'positive' : 'negative'"
              size="sm"
            />
            <div class="col text-body2" :class="lastChoiceCorrect ? 'text-positive' : 'text-negative'">
              {{ lastFeedback }}
            </div>
          </div>
        </q-card>

        <!-- Decision choices -->
        <template v-if="currentNode?.kind === 'decision' && lastFeedback === null">
          <div class="column q-gutter-xs">
            <q-btn
              v-for="choice in currentNode.choices"
              :key="choice.id"
              :label="choice.label"
              color="grey-2"
              text-color="grey-8"
              unelevated no-caps
              class="full-width text-left"
              align="left"
              style="white-space: normal; min-height: 44px"
              @click="onChoice(choice.id)"
            />
          </div>
        </template>

        <!-- Advance button (non-decision nodes, or after choice feedback) -->
        <template v-else-if="currentNode?.kind !== 'outcome'">
          <q-btn
            unelevated no-caps
            color="primary"
            :label="lastFeedback !== null ? 'Continue' : 'Next'"
            icon-right="arrow_forward"
            @click="onAdvance"
          />
        </template>

        <!-- Outcome node -->
        <template v-if="currentNode?.kind === 'outcome'">
          <q-btn
            unelevated no-caps
            color="positive"
            label="See Debrief"
            icon-right="assessment"
            @click="onFinish"
          />
        </template>

      </div>
    </template>

  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { getCase } from '@/data/cases/index';
import {
  startCase,
  getCurrentNode,
  advanceNode,
  selectChoice,
  finalizeCase,
  getDebrief,
} from '@/services/caseRunner';
import type { CaseState, CaseDebrief } from '@/services/caseRunner';
import type { CaseNodeKind } from '@/types/case';
import { localRepository } from '@/db/repository';

const router = useRouter();
const route = useRoute();
const caseId = (route.params as { id: string }).id;
const def = getCase(caseId);

const state = ref<CaseState | null>(null);
const showDebrief = ref(false);
const debrief = ref<CaseDebrief | null>(null);
const lastFeedback = ref<string | null>(null);
const lastChoiceCorrect = ref(false);
const sessionStartedAt = ref(0);

const currentNode = computed(() => (state.value ? getCurrentNode(state.value) : undefined));

const nodeCount = computed(() => def?.nodes.length ?? 0);
const visitedCount = computed(() => state.value?.steps.length ?? 0);
const progressPct = computed(() => (nodeCount.value > 0 ? visitedCount.value / nodeCount.value : 0));

function kindLabel(kind: CaseNodeKind): string {
  const labels: Record<CaseNodeKind, string> = {
    signalment: 'Signalment',
    history: 'History',
    exam: 'Examination',
    labs: 'Diagnostics',
    imaging: 'Imaging',
    decision: 'Decision',
    outcome: 'Outcome',
  };
  return labels[kind];
}

function kindColor(kind: CaseNodeKind): string {
  const colors: Record<CaseNodeKind, string> = {
    signalment: 'blue-grey',
    history: 'teal',
    exam: 'primary',
    labs: 'purple',
    imaging: 'indigo',
    decision: 'orange',
    outcome: 'positive',
  };
  return colors[kind];
}

function scoreLabel(pct: number): string {
  if (pct >= 90) return 'Excellent';
  if (pct >= 70) return 'Good';
  if (pct >= 50) return 'Satisfactory';
  return 'Needs improvement';
}

function restart() {
  if (!def) return;
  showDebrief.value = false;
  debrief.value = null;
  lastFeedback.value = null;
  lastChoiceCorrect.value = false;
  sessionStartedAt.value = Date.now();
  state.value = startCase(def);
}

function onChoice(choiceId: string) {
  if (!state.value) return;
  const node = getCurrentNode(state.value);
  const choice = (node?.choices ?? []).find((c) => c.id === choiceId);
  if (!choice) return;
  lastFeedback.value = choice.feedback;
  lastChoiceCorrect.value = choice.correct;
  state.value = selectChoice(state.value, choiceId);
}

function onAdvance() {
  if (!state.value) return;
  if (lastFeedback.value !== null) {
    // Feedback was shown after a decision — just clear feedback and move on
    lastFeedback.value = null;
    lastChoiceCorrect.value = false;
    return;
  }
  state.value = advanceNode(state.value);
}

async function onFinish() {
  if (!state.value) return;
  state.value = finalizeCase(state.value);
  debrief.value = getDebrief(state.value);
  showDebrief.value = true;

  // Persist session
  await localRepository.saveCaseSession({
    caseId,
    startedAt: sessionStartedAt.value,
    completedAt: Date.now(),
    score: state.value.score,
    maxScore: def?.maxScore ?? 0,
    steps: state.value.steps,
  });
}

onMounted(() => {
  if (def) {
    sessionStartedAt.value = Date.now();
    state.value = startCase(def);
  }
});
</script>

<style scoped>
.case-content {
  line-height: 1.6;
}
</style>
