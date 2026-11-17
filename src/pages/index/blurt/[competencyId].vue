<template>
  <q-page class="column items-stretch" style="max-width: 600px; margin: 0 auto">

    <!-- Header -->
    <div class="row items-center q-px-md q-pt-md q-pb-sm">
      <q-btn flat round dense icon="arrow_back" color="grey-7" @click="router.back()" />
      <div class="col q-ml-sm text-body2 text-weight-medium">Blurt Mode</div>
      <div class="text-caption text-grey-5">{{ competencyId }}</div>
    </div>
    <q-separator />

    <!-- Phase: Write ─────────────────────────────────────────── -->
    <template v-if="phase === 'write'">
      <div class="q-pa-md">
        <div class="text-subtitle2 text-grey-7 q-mb-xs">{{ prompt.instruction }}</div>
        <div class="text-caption text-grey-5 q-mb-md">
          Write everything you know — don't peek at your notes. Tap Reveal when done.
        </div>
        <q-input
          v-model="userBlurt"
          type="textarea"
          autogrow
          filled
          square
          placeholder="Start writing…"
          input-class="blurt-textarea"
        />
      </div>
      <q-space />
      <div class="q-pa-md">
        <q-btn
          color="primary" label="Reveal Key Points" unelevated no-caps class="full-width"
          style="min-height: 48px; border-radius: 8px; font-weight: 600"
          :disable="!userBlurt.trim()"
          @click="reveal"
        />
      </div>
    </template>

    <!-- Phase: Reveal ────────────────────────────────────────── -->
    <template v-else-if="phase === 'reveal'">
      <div class="q-pa-md col">
        <div class="row q-gutter-md q-mb-md">
          <!-- What you wrote -->
          <q-card class="dvmr-card col" style="min-width: 0">
            <q-card-section class="q-py-sm">
              <div class="text-caption text-grey-5 q-mb-xs">Your blurt</div>
              <div class="text-body2" style="white-space: pre-wrap; line-height: 1.65">{{ userBlurt }}</div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Key points reveal -->
        <div class="text-subtitle2 text-grey-7 q-mb-xs">Key Points</div>
        <q-card class="dvmr-card q-mb-md">
          <q-list dense separator>
            <q-item v-for="(point, i) in prompt.keyPoints" :key="i">
              <q-item-section avatar>
                <q-icon name="radio_button_unchecked" color="grey-4" size="xs" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-body2">{{ point }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>

        <!-- Self-score -->
        <div class="text-subtitle2 text-grey-7 q-mb-xs">How well did you do?</div>
        <div class="row q-gutter-sm">
          <q-btn
            v-for="s in SCORES"
            :key="s.value"
            :label="s.label"
            :color="selectedScore === s.value ? s.color : 'grey-2'"
            :text-color="selectedScore === s.value ? 'white' : 'grey-7'"
            unelevated no-caps
            class="col"
            style="min-height: 48px"
            @click="selectedScore = s.value"
          />
        </div>
      </div>

      <div class="q-pa-md">
        <q-btn
          color="primary" label="Done" unelevated no-caps class="full-width"
          style="min-height: 48px; border-radius: 8px; font-weight: 600"
          :disable="selectedScore === null"
          :loading="saving"
          @click="finish"
        />
      </div>
    </template>

    <!-- Phase: Done ──────────────────────────────────────────── -->
    <div v-else class="text-center q-pa-xl">
      <q-icon name="check_circle" color="positive" size="3rem" class="q-mb-md" />
      <div class="text-h6 text-weight-semibold q-mb-xs">Blurt recorded!</div>
      <div class="text-body2 text-grey-6 q-mb-xl">
        Self-score: <strong>{{ selectedScore }}/3</strong>
      </div>
      <div class="q-gutter-sm">
        <q-btn color="primary" unelevated no-caps label="Back to Notes"
          @click="router.push(`/notes/${encodeURIComponent(competencyId)}`)" />
        <q-btn outline color="primary" no-caps label="Blurt Again" @click="restart" />
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useCompetencyNotesStore } from '@/stores/competencyNotesStore';
import { buildBlurtPrompt } from '@/services/blurtMode';
import type { CompetencyNote } from '@/types/notes';

const router = useRouter();
const route = useRoute();
const notesStore = useCompetencyNotesStore();

const competencyId = computed(() => (route.params as { competencyId: string }).competencyId);

type Phase = 'write' | 'reveal' | 'done';
const phase = ref<Phase>('write');
const userBlurt = ref('');
const selectedScore = ref<1 | 2 | 3 | null>(null);
const saving = ref(false);
const startMs = ref(Date.now());
const sessionId = ref(crypto.randomUUID());

const SCORES = [
  { value: 1 as const, label: '1 — Barely recalled', color: 'negative' },
  { value: 2 as const, label: '2 — Partial', color: 'warning' },
  { value: 3 as const, label: '3 — Solid recall', color: 'positive' },
];

const placeholderNote: CompetencyNote = { competencyId: '', bodyMd: '', updatedAt: 0 };

const note = computed(() => notesStore.getNote(competencyId.value) ?? { ...placeholderNote, competencyId: competencyId.value });
const prompt = computed(() => buildBlurtPrompt(note.value));

onMounted(async () => {
  await notesStore.loadNote(competencyId.value);
  startMs.value = Date.now();
});

function reveal() {
  phase.value = 'reveal';
}

async function finish() {
  if (selectedScore.value === null) return;
  saving.value = true;
  try {
    const responseMs = Date.now() - startMs.value;
    await notesStore.recordBlurtSession(
      competencyId.value,
      selectedScore.value,
      sessionId.value,
      responseMs,
    );
    phase.value = 'done';
  } finally {
    saving.value = false;
  }
}

function restart() {
  userBlurt.value = '';
  selectedScore.value = null;
  phase.value = 'write';
  startMs.value = Date.now();
  sessionId.value = crypto.randomUUID();
}
</script>

<style scoped>
:deep(.blurt-textarea) {
  font-size: 0.9rem;
  line-height: 1.7;
  padding: 12px;
  min-height: 40vh;
  resize: none;
}
</style>
