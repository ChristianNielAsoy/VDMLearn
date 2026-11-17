<template>
  <!-- 404: lesson not found or no key terms -->
  <q-page v-if="!lesson || lesson.keyTerms.length === 0" class="flex flex-center">
    <div class="text-center">
      <q-icon name="style" size="4rem" color="grey-4" />
      <div class="text-body1 q-mt-sm text-grey">No flashcards for this lesson</div>
      <q-btn flat color="primary" label="Back to Lessons" to="/lessons" no-caps class="q-mt-sm" />
    </div>
  </q-page>

  <!-- Done screen -->
  <q-page v-else-if="store.done" class="flex flex-center q-pa-md">
    <div style="max-width: 360px; width: 100%">
      <div class="text-center q-mb-xl">
        <q-icon name="emoji_events" color="amber-6" size="4rem" />
        <div class="text-h6 q-mt-sm">Session Complete!</div>
        <div class="text-caption text-grey">{{ lesson.topic }}</div>
      </div>

      <div class="row justify-around q-mb-xl">
        <div class="text-center">
          <div class="text-h3 text-positive text-weight-bold">{{ store.knownCount }}</div>
          <div class="text-body2 text-grey">Known</div>
        </div>
        <q-separator vertical />
        <div class="text-center">
          <div class="text-h3 text-negative text-weight-bold">{{ store.unknownCount }}</div>
          <div class="text-body2 text-grey">Still Learning</div>
        </div>
      </div>

      <q-btn
        v-if="store.unknownCount > 0"
        color="primary"
        unelevated
        no-caps
        class="full-width q-mb-sm"
        style="min-height: 44px"
        icon="refresh"
        label="Retry Unknown"
        @click="store.retryUnknown"
      />
      <q-btn
        flat
        no-caps
        class="full-width"
        :to="`/lessons/${lessonIdParam}`"
        label="Back to Lesson"
      />
    </div>
  </q-page>

  <!-- Flashcard session -->
  <q-page v-else class="q-pa-md" style="max-width: 640px; margin: 0 auto">
    <!-- Header -->
    <div class="row items-center no-wrap q-mb-md">
      <q-btn flat round dense icon="arrow_back" :to="`/lessons/${lessonIdParam}`" class="q-mr-sm" />
      <div class="col ellipsis">
        <div class="text-body2 text-weight-medium ellipsis">{{ lesson.topic }}</div>
        <div class="text-caption text-grey">
          {{ store.currentIndex + 1 }} / {{ store.deck.length }}
          <span v-if="store.knownCount > 0"> · {{ store.knownCount }} known</span>
        </div>
      </div>
      <q-btn flat round dense icon="restart_alt" @click="store.reset" title="Restart" />
    </div>

    <!-- Progress bar -->
    <q-linear-progress
      :value="store.progress"
      color="primary"
      track-color="grey-3"
      rounded
      size="4px"
      class="q-mb-lg"
    />

    <!-- Flip card -->
    <div class="flip-container q-mb-xl" @click="store.flip()">
      <div class="flip-card" :class="{ flipped: store.flipped }">
        <!-- Front: Term -->
        <div class="flip-face flip-front">
          <div class="text-overline text-grey-6 q-mb-md">TERM</div>
          <div class="text-h5 text-weight-medium text-center" style="line-height: 1.3">
            {{ store.currentCard?.term }}
          </div>
          <div class="text-caption text-grey q-mt-lg">
            <q-icon name="touch_app" class="q-mr-xs" />Tap to reveal definition
          </div>
        </div>
        <!-- Back: Definition -->
        <div class="flip-face flip-back bg-primary text-white">
          <div class="text-overline q-mb-md" style="opacity: 0.7">DEFINITION</div>
          <div class="text-body1 text-center" style="line-height: 1.5">
            {{ store.currentCard?.definition }}
          </div>
        </div>
      </div>
    </div>

    <!-- Action buttons (shown after flip) -->
    <transition name="fade">
      <div v-if="store.flipped" class="row justify-center q-gutter-lg">
        <div class="text-center">
          <q-btn
            round
            unelevated
            color="negative"
            icon="close"
            size="lg"
            @click="store.markUnknown()"
          />
          <div class="text-caption text-grey q-mt-xs">Still Learning</div>
        </div>
        <div class="text-center">
          <q-btn
            round
            unelevated
            color="positive"
            icon="check"
            size="lg"
            @click="store.markKnown()"
          />
          <div class="text-caption text-grey q-mt-xs">Know It</div>
        </div>
      </div>
    </transition>

    <!-- Hint when not yet flipped -->
    <div v-if="!store.flipped" class="text-center text-caption text-grey q-mt-xl">
      Flip the card to see the definition, then mark it
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useFlashcardStore } from '@/stores/flashcardStore';
import { useLessonStore } from '@/stores/lessonStore';

const route = useRoute();
const store = useFlashcardStore();
const lessonStore = useLessonStore();

const lessonIdParam = computed(() => (route.params as unknown as { lessonId: string }).lessonId);
const lesson = computed(
  () => lessonStore.lessons.find((l) => l.id === lessonIdParam.value) ?? null,
);

onMounted(() => {
  if (lesson.value) {
    store.loadFromLesson(lesson.value);
  }
});
</script>

<style scoped>
.flip-container {
  perspective: 1200px;
  width: 100%;
  max-width: 480px;
  height: 260px;
  margin: 0 auto;
  cursor: pointer;
  user-select: none;
}

.flip-card {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.45s ease;
  transform-style: preserve-3d;
}

.flip-card.flipped {
  transform: rotateY(180deg);
}

.flip-face {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 28px 24px;
  box-sizing: border-box;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.1);
  background: white;
  border: 1px solid #e0e0e0;
}

.flip-back {
  transform: rotateY(180deg);
  border-color: transparent;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
