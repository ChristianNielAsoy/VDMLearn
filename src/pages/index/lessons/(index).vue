<template>
  <q-page class="q-pa-md" style="max-width: 640px; margin: 0 auto">
    <div class="text-h6 q-mb-xs">Lessons</div>
    <div class="text-caption text-grey q-mb-md">
      Study articles with key terms, high-yield points, and linked practice questions.
    </div>

    <div v-if="lessonStore.lessons.length === 0" class="text-center text-grey q-mt-xl">
      <q-icon name="menu_book" size="4rem" color="grey-3" />
      <div class="text-body1 q-mt-sm">No lessons yet</div>
    </div>

    <template v-else>
      <div v-for="subject in presentSubjects" :key="subject">
        <div class="text-caption text-weight-medium text-grey-7 q-mb-xs q-mt-md text-uppercase">
          {{ subject }}
        </div>
        <q-list dense bordered separator rounded class="q-mb-sm">
          <q-item
            v-for="lesson in bySubject.get(subject)"
            :key="lesson.id"
            clickable
            v-ripple
            :to="`/lessons/${lesson.id}`"
            class="q-py-sm"
          >
            <q-item-section>
              <q-item-label class="text-body2">{{ lesson.topic }}</q-item-label>
              <q-item-label caption class="text-grey-6">
                {{ lesson.subject }} · Year {{ lesson.year }}
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-chip
                dense
                size="sm"
                :color="statusColor(lesson.id)"
                text-color="white"
                class="text-caption"
              >
                {{ lessonStore.getStatus(lesson.id) }}
              </q-chip>
            </q-item-section>
          </q-item>
        </q-list>
      </div>
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useLessonStore } from '@/stores/lessonStore';
import type { LessonStatus } from '@/types/lesson';

const lessonStore = useLessonStore();

onMounted(() => void lessonStore.loadStatuses());

const bySubject = computed(() => {
  const map = new Map<string, (typeof lessonStore.lessons)[number][]>();
  for (const lesson of lessonStore.lessons) {
    const arr = map.get(lesson.vmleSubject) ?? [];
    arr.push(lesson);
    map.set(lesson.vmleSubject, arr);
  }
  return map;
});

const presentSubjects = computed(() => [...bySubject.value.keys()]);

function statusColor(lessonId: string): string {
  const s: LessonStatus = lessonStore.getStatus(lessonId);
  if (s === 'reviewed') return 'positive';
  if (s === 'read') return 'primary';
  return 'grey-5';
}
</script>
