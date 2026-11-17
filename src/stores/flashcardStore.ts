import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Lesson } from '@/types/lesson';

export interface FlashCard {
  term: string;
  definition: string;
  lessonId: string;
}

export const useFlashcardStore = defineStore('flashcard', () => {
  const deck = ref<FlashCard[]>([]);
  const currentIndex = ref(0);
  const knownIndices = ref<Set<number>>(new Set());
  const flipped = ref(false);
  const done = ref(false);
  const lessonId = ref('');

  const currentCard = computed(() => deck.value[currentIndex.value] ?? null);
  const knownCount = computed(() => knownIndices.value.size);
  const unknownCount = computed(() => deck.value.length - knownIndices.value.size);
  const progress = computed(() =>
    deck.value.length > 0 ? currentIndex.value / deck.value.length : 0,
  );

  function loadFromLesson(lesson: Lesson) {
    deck.value = lesson.keyTerms.map((kt) => ({ ...kt, lessonId: lesson.id }));
    lessonId.value = lesson.id;
    currentIndex.value = 0;
    knownIndices.value = new Set();
    flipped.value = false;
    done.value = false;
  }

  function flip() {
    flipped.value = !flipped.value;
  }

  function markKnown() {
    knownIndices.value = new Set([...knownIndices.value, currentIndex.value]);
    advance();
  }

  function markUnknown() {
    advance();
  }

  function advance() {
    if (currentIndex.value >= deck.value.length - 1) {
      done.value = true;
    } else {
      currentIndex.value++;
      flipped.value = false;
    }
  }

  function retryUnknown() {
    const unknown = deck.value.filter((_, i) => !knownIndices.value.has(i));
    deck.value = unknown;
    currentIndex.value = 0;
    knownIndices.value = new Set();
    flipped.value = false;
    done.value = false;
  }

  function reset() {
    currentIndex.value = 0;
    knownIndices.value = new Set();
    flipped.value = false;
    done.value = false;
  }

  return {
    deck,
    currentIndex,
    knownIndices,
    flipped,
    done,
    lessonId,
    currentCard,
    knownCount,
    unknownCount,
    progress,
    loadFromLesson,
    flip,
    markKnown,
    markUnknown,
    retryUnknown,
    reset,
  };
});
