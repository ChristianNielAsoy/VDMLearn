<template>
  <q-page class="column items-stretch" style="max-width: 600px; margin: 0 auto">
    <!-- Header -->
    <div class="row items-center q-px-md q-pt-md q-pb-sm">
      <q-btn flat round dense icon="arrow_back" color="grey-7" @click="router.back()" />
      <div class="col q-ml-sm">
        <div class="text-body2 text-weight-medium">Cloze Drill</div>
        <div class="text-caption text-grey-5">{{ competencyId }}</div>
      </div>
      <div class="text-caption text-grey-5">{{ currentIndex + 1 }}/{{ cards.length }}</div>
    </div>

    <q-separator />

    <!-- No cards -->
    <div v-if="cards.length === 0" class="text-center q-pa-xl">
      <q-icon name="flash_on" size="3rem" color="grey-3" />
      <div class="q-mt-sm text-grey-5">No cloze cards for this competency.</div>
      <div class="text-caption q-mt-xs text-grey-4">
        Add ==highlights== in your notes to generate cards.
      </div>
      <q-btn
        outline
        color="primary"
        no-caps
        label="Open Notes"
        class="q-mt-md"
        @click="router.push(`/notes/${encodeURIComponent(competencyId)}`)"
      />
    </div>

    <!-- Finished -->
    <div v-else-if="finished" class="text-center q-pa-xl">
      <q-icon name="check_circle" color="positive" size="3rem" class="q-mb-md" />
      <div class="text-h6 text-weight-semibold q-mb-xs">Drill complete!</div>
      <div class="text-body2 text-grey-6 q-mb-xl">{{ correct }}/{{ cards.length }} correct</div>
      <div class="q-gutter-sm">
        <q-btn color="primary" unelevated no-caps label="Drill Again" @click="restart" />
        <q-btn
          outline
          color="primary"
          no-caps
          label="Back to Notes"
          @click="router.push(`/notes/${encodeURIComponent(competencyId)}`)"
        />
      </div>
    </div>

    <!-- Active drill -->
    <template v-else-if="currentCard">
      <!-- Progress bar -->
      <q-linear-progress
        :value="currentIndex / cards.length"
        color="primary"
        track-color="grey-2"
        class="q-mb-sm"
        size="4px"
      />

      <div class="q-pa-md col column">
        <!-- Front (prompt) -->
        <q-card class="dvmr-card q-mb-md">
          <q-card-section>
            <div class="text-caption text-grey-5 q-mb-xs">Fill in the blank</div>
            <div class="text-body1" style="line-height: 1.8; font-size: 1.05rem">
              {{ currentCard.front }}
            </div>
          </q-card-section>
        </q-card>

        <!-- Answer input -->
        <q-input
          v-if="!revealed"
          v-model="userAnswer"
          outlined
          autofocus
          label="Your answer"
          class="q-mb-md"
          @keydown.enter="reveal"
        />

        <!-- Revealed answer -->
        <template v-if="revealed">
          <q-card
            class="dvmr-card q-mb-md"
            :class="isCorrectAnswer ? 'correct-card' : 'incorrect-card'"
          >
            <q-card-section class="q-py-sm">
              <div class="row items-center q-mb-xs">
                <q-icon
                  :name="isCorrectAnswer ? 'check_circle' : 'cancel'"
                  :color="isCorrectAnswer ? 'positive' : 'negative'"
                  size="sm"
                  class="q-mr-xs"
                />
                <span
                  class="text-caption text-weight-medium"
                  :class="isCorrectAnswer ? 'text-positive' : 'text-negative'"
                >
                  {{ isCorrectAnswer ? 'Correct!' : 'Incorrect' }}
                </span>
              </div>
              <div class="text-body2" style="line-height: 1.7">{{ currentCard.back }}</div>
            </q-card-section>
          </q-card>

          <q-btn
            color="primary"
            unelevated
            no-caps
            class="full-width"
            style="min-height: 48px; border-radius: 8px; font-weight: 600"
            :label="currentIndex + 1 < cards.length ? 'Next Card →' : 'Finish'"
            @click="advance"
          />
        </template>

        <q-btn
          v-else
          color="primary"
          unelevated
          no-caps
          class="full-width"
          style="min-height: 48px; border-radius: 8px; font-weight: 600"
          label="Reveal Answer"
          @click="reveal"
        />
      </div>
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useCompetencyNotesStore } from '@/stores/competencyNotesStore';

const router = useRouter();
const route = useRoute();
const notesStore = useCompetencyNotesStore();

const competencyId = computed(() => (route.params as { competencyId: string }).competencyId);
const cards = computed(() => notesStore.getClozeCards(competencyId.value));

const currentIndex = ref(0);
const userAnswer = ref('');
const revealed = ref(false);
const correct = ref(0);
const finished = ref(false);

const currentCard = computed(() => cards.value[currentIndex.value]);

const isCorrectAnswer = computed(() => {
  if (!currentCard.value) return false;
  const back = currentCard.value.back.toLowerCase();
  const answer = userAnswer.value.trim().toLowerCase();
  return answer.length > 0 && back.includes(answer);
});

onMounted(async () => {
  await notesStore.loadNote(competencyId.value);
});

function reveal() {
  if (!userAnswer.value.trim() && !revealed.value) return;
  revealed.value = true;
  if (isCorrectAnswer.value) correct.value++;
}

function advance() {
  if (currentIndex.value + 1 < cards.value.length) {
    currentIndex.value++;
    userAnswer.value = '';
    revealed.value = false;
  } else {
    finished.value = true;
  }
}

function restart() {
  currentIndex.value = 0;
  userAnswer.value = '';
  revealed.value = false;
  correct.value = 0;
  finished.value = false;
}
</script>

<style scoped>
.correct-card {
  border: 1px solid #10b981;
  background: #ecfdf5;
}

.incorrect-card {
  border: 1px solid #ef4444;
  background: #fef2f2;
}
</style>
