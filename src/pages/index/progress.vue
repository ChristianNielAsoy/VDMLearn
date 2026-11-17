<template>
  <q-page class="column" style="max-width: 600px; margin: 0 auto">

    <!-- Tab bar -->
    <q-tabs
      v-model="activeTab"
      dense
      align="justify"
      active-color="primary"
      indicator-color="primary"
      class="q-px-md"
      style="border-bottom: 1px solid var(--dvmr-border)"
    >
      <q-tab name="overview"  label="Overview"  no-caps />
      <q-tab name="mastery"   label="Mastery"   no-caps />
      <q-tab name="bloom"     label="Bloom"     no-caps />
      <q-tab name="coverage"  label="Coverage"  no-caps />
    </q-tabs>

    <div v-if="progressStore.loading || masteryStore.loading" class="text-center q-pa-xl">
      <q-spinner color="primary" size="2rem" />
    </div>

    <q-tab-panels v-else v-model="activeTab" animated class="col">

      <!-- ── Overview ─────────────────────────────────────────── -->
      <q-tab-panel name="overview" class="q-pa-md">

        <!-- Due today -->
        <q-card class="dvmr-card q-mb-sm">
          <q-card-section class="row items-center q-py-sm">
            <q-icon name="schedule" color="primary" size="sm" class="q-mr-sm" />
            <div class="col">
              <div class="text-body2 text-weight-medium">Due for review</div>
              <div class="text-caption text-grey-6">
                {{ progressStore.dueQuestions.length }} question{{ progressStore.dueQuestions.length !== 1 ? 's' : '' }}
              </div>
            </div>
            <q-btn
              v-if="progressStore.dueQuestions.length > 0"
              color="primary" label="Study Now" unelevated no-caps dense
              @click="studyDue"
            />
            <q-badge v-else color="positive" label="All caught up!" />
          </q-card-section>
        </q-card>

        <!-- Accuracy by subject -->
        <div class="text-subtitle2 text-grey-7 q-mt-md q-mb-xs">Accuracy by Subject</div>
        <q-banner rounded dense class="text-caption bg-amber-1 text-amber-9 q-mb-sm">
          <template #avatar><q-icon name="info" color="amber-7" /></template>
          For study purposes only — not clinical guidance.
        </q-banner>

        <div v-if="progressStore.accuracy.every((a) => a.attempts === 0)" class="text-center text-grey q-pa-lg">
          <q-icon name="bar_chart" size="3rem" color="grey-3" />
          <div class="q-mt-sm">No attempts yet. Answer questions to see accuracy.</div>
        </div>

        <q-card v-else class="dvmr-card">
          <q-list dense separator>
            <q-item v-for="item in progressStore.accuracy" :key="item.subject" class="q-py-sm" :class="isWeak(item) ? 'bg-red-1' : ''">
              <q-item-section>
                <div class="row items-center q-mb-xs">
                  <span class="text-body2 text-weight-medium col ellipsis">{{ item.subject }}</span>
                  <q-badge :color="item.attempts > 0 ? accuracyColor(item.pct) : 'grey-4'" :text-color="item.attempts > 0 ? 'white' : 'grey-6'">
                    {{ item.attempts > 0 ? `${item.pct}%` : '—' }}
                  </q-badge>
                </div>
                <q-linear-progress :value="item.attempts > 0 ? item.correct / item.attempts : 0" :color="accuracyColor(item.pct)" rounded size="5px" track-color="grey-2" />
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>

        <!-- Bookmarks -->
        <template v-if="progressStore.bookmarkedQuestions.length > 0">
          <div class="text-subtitle2 text-grey-7 q-mt-md q-mb-xs row items-center">
            <q-icon name="bookmark" color="amber-7" size="xs" class="q-mr-xs" />Bookmarked
            <q-space />
            <q-btn flat dense no-caps color="primary" label="Quiz all" size="sm" @click="studyBookmarks" />
          </div>
          <q-card class="dvmr-card">
            <q-list dense separator>
              <q-item v-for="q in progressStore.bookmarkedQuestions" :key="q.id">
                <q-item-section>
                  <q-item-label class="text-caption ellipsis">{{ q.stem }}</q-item-label>
                  <q-item-label caption class="text-grey-6">{{ q.vmleSubject }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-btn flat round dense icon="bookmark_remove" color="amber-7" size="sm" @click="progressStore.toggleBookmark(q.id)" />
                </q-item-section>
              </q-item>
            </q-list>
          </q-card>
        </template>
      </q-tab-panel>

      <!-- ── Mastery ────────────────────────────────────────────── -->
      <q-tab-panel name="mastery" class="q-pa-md">
        <div v-if="!masteryStore.report" class="text-center text-grey-5 q-pa-lg">
          Answer some questions to see mastery scores.
        </div>
        <template v-else>
          <!-- Subject heatmap grid -->
          <div class="text-subtitle2 text-grey-7 q-mb-sm">Readiness Heatmap</div>
          <div class="heatmap-grid q-mb-md">
            <div
              v-for="sub in masteryStore.report.subjects"
              :key="sub.subject"
              class="heatmap-cell"
              :style="{ background: masteryBg(sub.subjectMastery) }"
            >
              <div class="heatmap-label">{{ subjectShort(sub.subject) }}</div>
              <div class="heatmap-pct">{{ Math.round(sub.subjectMastery * 100) }}%</div>
            </div>
          </div>

          <!-- Per-subject mastery bars -->
          <div class="text-subtitle2 text-grey-7 q-mb-xs">Subject Detail</div>
          <q-card
            v-for="sub in masteryStore.report.subjects"
            :key="sub.subject"
            class="dvmr-card q-pa-sm q-mb-xs"
          >
            <div class="row items-center q-mb-xs">
              <span class="text-body2 text-weight-medium col">{{ sub.subject }}</span>
              <q-badge :color="sub.meetsSubjectMin ? 'positive' : 'warning'" style="font-size: 9px">
                {{ Math.round(sub.subjectMastery * 100) }}%
              </q-badge>
            </div>
            <div class="row q-gutter-xs text-caption text-grey-6 q-mb-xs">
              <span>Accuracy {{ pctStr(sub.competencyMasteries[0]?.recentAccuracy) }}</span>
              <span>·</span>
              <span>Memory {{ pctStr(sub.competencyMasteries[0]?.memoryStrength) }}</span>
              <span>·</span>
              <span>Coverage {{ pctStr(sub.competencyMasteries[0]?.coverage) }}</span>
            </div>
            <q-linear-progress
              :value="sub.subjectMastery"
              :color="masteryColor(sub.subjectMastery)"
              track-color="grey-2"
              rounded
              size="6px"
            />
          </q-card>

          <div class="text-caption text-grey-5 text-center q-mt-md">
            Mastery = 40% accuracy + 40% memory strength + 20% coverage. Estimates only.
          </div>
        </template>
      </q-tab-panel>

      <!-- ── Bloom ──────────────────────────────────────────────── -->
      <q-tab-panel name="bloom" class="q-pa-md">
        <div class="text-subtitle2 text-grey-7 q-mb-xs">Bloom's Taxonomy Performance</div>
        <div class="text-caption text-grey-6 q-mb-md">
          Compares your accuracy per cognitive level against the TOS target distribution.
          Only questions with a tagged Bloom level are counted.
        </div>

        <div v-if="bloomData.length === 0" class="text-center text-grey-5 q-pa-lg">
          No questions with Bloom level tags yet.
        </div>

        <q-card v-else class="dvmr-card q-pa-md">
          <div v-for="b in bloomData" :key="b.level" class="q-mb-md">
            <div class="row items-center q-mb-xs">
              <span class="text-body2 text-weight-medium col">{{ b.label }}</span>
              <span class="text-caption text-grey-6">
                {{ b.attempts > 0 ? `${Math.round(b.accuracy * 100)}% acc` : 'no data' }}
                · TOS {{ b.tosTargetPct }}%
              </span>
            </div>
            <!-- Accuracy bar -->
            <q-linear-progress
              :value="b.attempts > 0 ? b.accuracy : 0"
              :color="bloomColor(b.level)"
              track-color="grey-2"
              rounded
              size="8px"
              class="q-mb-xs"
            />
            <!-- TOS target marker (shown as a thin bar) -->
            <div class="row items-center q-gutter-xs">
              <div class="bloom-target-bar" :style="{ width: `${b.tosTargetPct}%` }" />
              <span class="text-caption text-grey-4">TOS target</span>
            </div>
          </div>
        </q-card>
      </q-tab-panel>

      <!-- ── Coverage ───────────────────────────────────────────── -->
      <q-tab-panel name="coverage" class="q-pa-md">
        <div class="text-subtitle2 text-grey-7 q-mb-xs">Question Coverage</div>
        <div class="text-caption text-grey-6 q-mb-md">
          Fraction of each subject's TOS items you have seen or attempted.
        </div>

        <div v-if="!masteryStore.report" class="text-center text-grey-5 q-pa-lg">
          No data yet.
        </div>

        <q-card v-else class="dvmr-card">
          <q-list dense separator>
            <q-item v-for="sub in masteryStore.report.subjects" :key="sub.subject" class="q-py-sm">
              <q-item-section>
                <div class="row items-center q-mb-xs">
                  <span class="text-body2 col">{{ sub.subject }}</span>
                  <span class="text-caption text-grey-6">{{ avgCovPct(sub) }}%</span>
                </div>
                <q-linear-progress
                  :value="avgCoverage(sub)"
                  color="info"
                  track-color="grey-2"
                  rounded
                  size="5px"
                />
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>

        <div class="text-caption text-grey-5 text-center q-mt-md">
          Coverage = distinct questions seen ÷ TOS items per subject.
        </div>
      </q-tab-panel>
    </q-tab-panels>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useProgressStore } from '@/stores/progressStore';
import { useMasteryStore } from '@/stores/masteryStore';
import { useQuizStore } from '@/stores/quizStore';
import { computeBloomPerformance, BLOOM_LABELS } from '@/services/bloomAnalytics';
import { localRepository } from '@/db/repository';
import { loadAllQuestions } from '@/data/loaders/questions';
import type { SubjectAccuracy } from '@/stores/progressStore';
import type { SubjectReadiness } from '@/services/mastery';
import type { BloomLevel } from '@/types/question';

const BLOOM_COLORS: Record<BloomLevel, string> = {
  R: '#94a3b8', U: '#60a5fa', Ap: '#34d399', An: '#fbbf24', E: '#f87171', C: '#c084fc',
};

const activeTab = ref('overview');
const progressStore = useProgressStore();
const masteryStore = useMasteryStore();
const quizStore = useQuizStore();
const router = useRouter();

// Bloom data loaded async
const bloomData = ref<Awaited<ReturnType<typeof computeBloomPerformance>>>([]);

async function loadBloomData() {
  const [questions, events] = await Promise.all([
    loadAllQuestions(),
    localRepository.getReviewEvents(),
  ]);
  const qMap = new Map(questions.map((q) => [q.id, q]));
  bloomData.value = computeBloomPerformance(events, qMap);
}

function bloomColor(level: BloomLevel): string {
  return BLOOM_COLORS[level] ? 'primary' : 'primary';
}

// ── Helpers ────────────────────────────────────────────────────

function accuracyColor(pct: number): string {
  if (pct >= 75) return 'positive';
  if (pct >= 50) return 'warning';
  return 'negative';
}

function isWeak(item: SubjectAccuracy): boolean {
  return item.attempts >= 5 && item.pct < 60;
}

function masteryColor(val: number): string {
  if (val >= 0.75) return 'positive';
  if (val >= 0.5) return 'warning';
  return 'negative';
}

function masteryBg(val: number): string {
  if (val >= 0.75) return 'rgba(16,185,129,0.15)';
  if (val >= 0.5)  return 'rgba(245,158,11,0.15)';
  return 'rgba(244,63,94,0.12)';
}

function pctStr(val: number | undefined): string {
  if (val === undefined || Number.isNaN(val)) return '—';
  return `${Math.round(val * 100)}%`;
}

function avgCoverage(sub: SubjectReadiness): number {
  if (sub.competencyMasteries.length === 0) return 0;
  return sub.competencyMasteries.reduce((s, c) => s + c.coverage, 0) / sub.competencyMasteries.length;
}

function avgCovPct(sub: SubjectReadiness): number {
  return Math.round(avgCoverage(sub) * 100);
}

// Short subject label for heatmap cell
function subjectShort(name: string): string {
  const map: Record<string, string> = {
    'Veterinary Anatomy': 'Anat',
    'Veterinary Physiology': 'Phys',
    'Zootechnics': 'Zoo',
    'Veterinary Pathology': 'Path',
    'Veterinary Pharmacology': 'Pharm',
    'Veterinary Medicine': 'Med',
    'Veterinary Microbiology and Public Health': 'Micro',
    'Veterinary Parasitology': 'Para',
    'Veterinary Surgery': 'Surg',
  };
  return map[name] ?? name.slice(0, 4);
}

// ── Quiz actions ───────────────────────────────────────────────

function studyDue() {
  if (progressStore.dueQuestions.length === 0) return;
  quizStore.startQuiz(progressStore.dueQuestions, { type: 'due', label: 'Due Today' });
  void router.push('/quiz');
}

function studyBookmarks() {
  if (progressStore.bookmarkedQuestions.length === 0) return;
  quizStore.startQuiz(progressStore.bookmarkedQuestions, { type: 'bookmarked', label: 'Bookmarked' });
  void router.push('/quiz');
}

void BLOOM_LABELS; // referenced in template via bloomData

onMounted(async () => {
  await Promise.all([progressStore.refresh(), masteryStore.refresh()]);
  await loadBloomData();
});
</script>

<style scoped>
/* ── Heatmap grid ─────────────────────────────────────────── */
.heatmap-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.heatmap-cell {
  border-radius: var(--dvmr-radius-sm);
  padding: 10px 8px;
  text-align: center;
  border: 1px solid var(--dvmr-border);
  transition: transform var(--dvmr-transition-fast);
}

.heatmap-cell:hover {
  transform: scale(1.02);
}

.heatmap-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: #374151;
  letter-spacing: 0.02em;
}

.heatmap-pct {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1f2937;
  margin-top: 2px;
}

/* ── Bloom target reference bar ──────────────────────────── */
.bloom-target-bar {
  height: 3px;
  background: rgba(0, 0, 0, 0.18);
  border-radius: 999px;
  min-width: 2px;
}
</style>
