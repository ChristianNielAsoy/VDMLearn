import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { localRepository } from '@/db/repository';
import type { SchoolTask, PlannerSettings, TaskType, TaskStatus } from '@/types/task';

function makeId(): string {
  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export const usePlannerStore = defineStore('planner', () => {
  const tasks = ref<SchoolTask[]>([]);
  const settings = ref<PlannerSettings>({
    id: 'singleton',
    examDate: new Date('2026-11-04').getTime(),
    weeklyQuestionGoal: 50,
    weeklyLessonGoal: 3,
  });
  const weeklyAttempts = ref(0);
  const weeklyLessonsRead = ref(0);
  const loaded = ref(false);

  const daysUntilExam = computed(() => {
    if (!settings.value.examDate) return null;
    const diff = settings.value.examDate - Date.now();
    return Math.max(0, Math.ceil(diff / 86_400_000));
  });

  const examDateStr = computed(() => {
    if (!settings.value.examDate) return null;
    return new Date(settings.value.examDate).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  });

  // Task groupings (computed fresh each access)
  function groupedTasks() {
    const todayMs = (() => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    })();
    const tomorrowMs = todayMs + 86_400_000;
    const nextWeekMs = todayMs + 7 * 86_400_000;

    const active = tasks.value.filter((t) => t.status !== 'done');
    return {
      overdue: active.filter((t) => t.dueAt < todayMs),
      today: active.filter((t) => t.dueAt >= todayMs && t.dueAt < tomorrowMs),
      thisWeek: active.filter((t) => t.dueAt >= tomorrowMs && t.dueAt < nextWeekMs),
      later: active.filter((t) => t.dueAt >= nextWeekMs),
      done: tasks.value.filter((t) => t.status === 'done'),
    };
  }

  async function load() {
    if (loaded.value) return;
    const [savedTasks, savedSettings] = await Promise.all([
      localRepository.getTasks(),
      localRepository.getPlannerSettings(),
    ]);
    tasks.value = savedTasks;
    settings.value = savedSettings;
    await _refreshWeekly();
    loaded.value = true;
  }

  async function _refreshWeekly() {
    const since = Date.now() - 7 * 86_400_000;
    const [recentAttempts, allStatuses] = await Promise.all([
      localRepository.getAttemptsAfter(since),
      localRepository.getAllLessonStatuses(),
    ]);
    weeklyAttempts.value = recentAttempts.length;
    weeklyLessonsRead.value = allStatuses.filter(
      (s) => (s.status === 'read' || s.status === 'reviewed') && s.updatedAt >= since,
    ).length;
  }

  async function addTask(data: {
    title: string;
    subject: string;
    type: TaskType;
    dueAt: number;
    status: TaskStatus;
    notes?: string;
  }) {
    const task: SchoolTask = { ...data, id: makeId(), createdAt: Date.now() };
    await localRepository.addTask(task);
    tasks.value = [...tasks.value, task].sort((a, b) => a.dueAt - b.dueAt);
  }

  async function updateTask(task: SchoolTask) {
    await localRepository.updateTask(task);
    tasks.value = tasks.value
      .map((t) => (t.id === task.id ? task : t))
      .sort((a, b) => a.dueAt - b.dueAt);
  }

  async function deleteTask(id: string) {
    await localRepository.deleteTask(id);
    tasks.value = tasks.value.filter((t) => t.id !== id);
  }

  async function saveSettings(s: PlannerSettings) {
    settings.value = s;
    await localRepository.savePlannerSettings(s);
  }

  return {
    tasks,
    settings,
    weeklyAttempts,
    weeklyLessonsRead,
    loaded,
    daysUntilExam,
    examDateStr,
    load,
    groupedTasks,
    addTask,
    updateTask,
    deleteTask,
    saveSettings,
  };
});
