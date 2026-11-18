<template>
  <q-page class="column" style="max-width: 720px; margin: 0 auto">
    <div class="row items-center q-px-md q-pt-md q-pb-sm">
      <q-btn flat round dense icon="arrow_back" color="grey-7" @click="router.back()" />
      <div class="col q-ml-sm">
        <div v-if="diagram" class="text-body2 text-weight-medium">{{ diagram.title }}</div>
        <div v-else class="text-body2 text-grey-5">Diagram not found</div>
      </div>
      <q-btn-toggle
        v-if="diagram"
        v-model="mode"
        :options="[
          { value: 'atlas', label: 'Atlas' },
          { value: 'quiz', label: 'Quiz' },
        ]"
        no-caps
        dense
        unelevated
        rounded
        color="grey-2"
        text-color="grey-7"
        toggle-color="primary"
        toggle-text-color="white"
        size="sm"
      />
    </div>

    <q-separator />

    <div v-if="!diagram" class="text-center text-grey-5 q-pa-xl">Diagram not found.</div>

    <div v-else class="q-pa-md column q-gutter-md">
      <!-- Diagram -->
      <HotspotDiagram
        :diagram="diagram"
        :mode="mode"
        :correct="correct"
        :active-id="activeRegionId"
        :selected-id="selectedAtlasId"
        @region-click="onRegionClick"
      />

      <!-- Source -->
      <div class="text-caption text-grey-5">
        <q-icon name="menu_book" size="xs" /> {{ diagram.source }}
      </div>

      <!-- ── Atlas mode ───────────────────────────────────── -->
      <template v-if="mode === 'atlas'">
        <q-card class="dvmr-card">
          <q-list dense separator>
            <q-item
              v-for="(region, i) in diagram.regions"
              :key="region.id"
              clickable
              :class="selectedAtlasId === region.id ? 'bg-blue-1' : ''"
              @click="selectedAtlasId = selectedAtlasId === region.id ? null : region.id"
            >
              <q-item-section avatar style="min-width: 32px">
                <q-badge color="primary" :label="i + 1" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-body2 text-weight-medium">{{
                  region.label
                }}</q-item-label>
                <q-item-label v-if="region.description" caption class="text-grey-6">{{
                  region.description
                }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </template>

      <!-- ── Quiz mode ────────────────────────────────────── -->
      <template v-else>
        <!-- Finished -->
        <q-card v-if="quizDone" class="dvmr-card q-pa-md text-center">
          <q-icon name="emoji_events" color="positive" size="3rem" />
          <div class="text-h6 q-mt-sm">
            {{ correct.length }} / {{ diagram.regions.length }} correct
          </div>
          <div class="text-caption text-grey-6 q-mt-xs">
            {{ mistakeCount }} mistake{{ mistakeCount !== 1 ? 's' : '' }}
          </div>
          <q-btn
            unelevated
            no-caps
            color="primary"
            label="Restart"
            class="q-mt-md"
            @click="startQuiz"
          />
        </q-card>

        <template v-else>
          <!-- Current question -->
          <q-card class="dvmr-card q-pa-md">
            <div class="text-caption text-grey-5 q-mb-xs">
              Question {{ correct.length + 1 }} of {{ diagram.regions.length }}
            </div>
            <div class="text-body2 text-weight-medium q-mb-sm">
              Tap region <span class="text-primary">#{{ activeIndex + 1 }}</span> on the diagram.
            </div>
            <div class="text-body2 text-grey-7 q-mb-md">What is this structure?</div>

            <!-- Options (shuffled labels) -->
            <div class="column q-gutter-xs">
              <q-btn
                v-for="opt in options"
                :key="opt.id"
                :label="opt.label"
                :color="optionColor(opt.id)"
                :text-color="optionColor(opt.id) === 'grey-2' ? 'grey-7' : 'white'"
                unelevated
                no-caps
                class="full-width text-left"
                align="left"
                :disable="showResult"
                @click="selectOption(opt.id)"
              />
            </div>

            <!-- Result feedback -->
            <div v-if="showResult" class="q-mt-sm">
              <div v-if="lastCorrect" class="text-positive text-body2">
                <q-icon name="check_circle" /> Correct!
              </div>
              <div v-else class="text-negative text-body2">
                <q-icon name="cancel" /> Incorrect. Answer: {{ activeRegion?.label }}
              </div>
              <q-btn
                unelevated
                no-caps
                color="primary"
                label="Next"
                class="q-mt-sm"
                @click="advance"
              />
            </div>
          </q-card>
        </template>
      </template>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import HotspotDiagram from '@/components/HotspotDiagram.vue';
import { getHotspot } from '@/data/hotspots/index';
import type { HotspotRegion } from '@/types/hotspot';

const router = useRouter();
const route = useRoute();
const diagramId = (route.params as { id: string }).id;
const diagram = getHotspot(diagramId);

const mode = ref<'atlas' | 'quiz'>('atlas');
const selectedAtlasId = ref<string | null>(null);

// Quiz state
const shuffledRegions = ref<HotspotRegion[]>([]);
const activeIndex = ref(0);
const correct = ref<string[]>([]);
const mistakeCount = ref(0);
const showResult = ref(false);
const lastCorrect = ref(false);
const selectedOptionId = ref<string | null>(null);

const activeRegionId = computed(() => shuffledRegions.value[activeIndex.value]?.id ?? null);
const activeRegion = computed(
  () => diagram?.regions.find((r) => r.id === activeRegionId.value) ?? null,
);
const quizDone = computed(() => !!diagram && correct.value.length === diagram.regions.length);

const options = computed<HotspotRegion[]>(() => {
  if (!diagram) return [];
  const active = shuffledRegions.value[activeIndex.value];
  if (!active) return [];
  const others = diagram.regions.filter((r) => r.id !== active.id);
  const distractors = shuffledArr(others).slice(0, Math.min(3, others.length));
  return shuffledArr([active, ...distractors]);
});

function shuffledArr<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

function startQuiz() {
  if (!diagram) return;
  shuffledRegions.value = shuffledArr([...diagram.regions]);
  activeIndex.value = 0;
  correct.value = [];
  mistakeCount.value = 0;
  showResult.value = false;
  selectedOptionId.value = null;
}

function selectOption(id: string) {
  if (showResult.value) return;
  selectedOptionId.value = id;
  lastCorrect.value = id === activeRegionId.value;
  if (!lastCorrect.value) mistakeCount.value++;
  showResult.value = true;
}

function onRegionClick(id: string | null) {
  if (mode.value === 'atlas') {
    selectedAtlasId.value = id;
    return;
  }
  if (!id || showResult.value || quizDone.value) return;
  selectOption(id);
}

function advance() {
  if (lastCorrect.value) {
    correct.value.push(activeRegionId.value!);
  }
  activeIndex.value++;
  showResult.value = false;
  selectedOptionId.value = null;
}

function optionColor(id: string): string {
  if (!showResult.value) return 'grey-2';
  if (id === activeRegionId.value) return 'positive';
  if (id === selectedOptionId.value) return 'negative';
  return 'grey-2';
}

watch(mode, (m) => {
  if (m === 'quiz') startQuiz();
});
</script>
