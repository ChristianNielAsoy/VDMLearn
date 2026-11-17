import { defineStore } from 'pinia';
import { ref } from 'vue';
import { loadLessons } from '@/data/loaders/lessons';
import { localRepository } from '@/db/repository';
import type { Lesson, LessonStatus } from '@/types/lesson';

export const useLessonStore = defineStore('lessons', () => {
  const lessons = ref<Lesson[]>(loadLessons());
  const statuses = ref<Map<string, LessonStatus>>(new Map());
  const loaded = ref(false);

  async function loadStatuses() {
    if (loaded.value) return;
    const all = await localRepository.getAllLessonStatuses();
    statuses.value = new Map(all.map((s) => [s.lessonId, s.status]));
    loaded.value = true;
  }

  function getStatus(lessonId: string): LessonStatus {
    return statuses.value.get(lessonId) ?? 'unread';
  }

  async function setStatus(lessonId: string, status: LessonStatus) {
    statuses.value.set(lessonId, status);
    await localRepository.setLessonStatus(lessonId, status);
  }

  return { lessons, statuses, loaded, loadStatuses, getStatus, setStatus };
});
