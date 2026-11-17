<template>
  <q-page class="q-pa-md" style="max-width: 640px; margin: 0 auto">
    <div class="text-h6 q-mb-sm">Study Planner</div>

    <q-tabs
      v-model="activeTab"
      dense
      align="left"
      active-color="primary"
      indicator-color="primary"
      class="q-mb-md text-grey-7"
    >
      <q-tab name="study" label="Study Plan" icon="school" no-caps />
      <q-tab name="tasks" label="School Tasks" icon="checklist" no-caps />
    </q-tabs>

    <q-tab-panels v-model="activeTab" animated>
      <!-- ── Study Plan ── -->
      <q-tab-panel name="study" class="q-pa-none">
        <!-- Exam countdown -->
        <q-card flat bordered class="q-mb-md">
          <q-card-section class="row items-center q-py-sm no-wrap">
            <q-icon name="event" color="primary" size="md" class="q-mr-sm" />
            <div class="col">
              <div class="text-overline text-grey-6">NEXT VMLE EXAM</div>
              <div
                v-if="plannerStore.daysUntilExam !== null"
                class="text-h5 text-weight-bold text-primary"
              >
                {{ plannerStore.daysUntilExam }} day{{
                  plannerStore.daysUntilExam !== 1 ? 's' : ''
                }}
              </div>
              <div v-else class="text-body2 text-grey">No date set</div>
              <div class="text-caption text-grey">
                {{ plannerStore.examDateStr ?? 'Tap edit to set' }}
              </div>
            </div>
            <q-btn flat round dense icon="edit" @click="openDateDialog" />
          </q-card-section>
        </q-card>

        <!-- Weekly goals -->
        <q-card flat bordered class="q-mb-md">
          <q-card-section class="q-py-sm">
            <div class="row items-center q-mb-sm">
              <div class="text-body2 text-weight-medium col">Weekly Goals</div>
              <q-btn flat round dense icon="edit" size="sm" @click="openGoalDialog" />
            </div>

            <div class="q-mb-sm">
              <div class="row items-center q-mb-xs">
                <span class="text-caption col">Questions answered</span>
                <span class="text-caption text-weight-medium">
                  {{ plannerStore.weeklyAttempts }} / {{ plannerStore.settings.weeklyQuestionGoal }}
                  <q-icon
                    v-if="plannerStore.weeklyAttempts >= plannerStore.settings.weeklyQuestionGoal"
                    name="check_circle"
                    color="positive"
                    size="xs"
                    class="q-ml-xs"
                  />
                </span>
              </div>
              <q-linear-progress
                :value="
                  Math.min(
                    1,
                    plannerStore.weeklyAttempts / plannerStore.settings.weeklyQuestionGoal,
                  )
                "
                color="primary"
                track-color="grey-3"
                rounded
                size="6px"
              />
            </div>

            <div>
              <div class="row items-center q-mb-xs">
                <span class="text-caption col">Lessons read / reviewed</span>
                <span class="text-caption text-weight-medium">
                  {{ plannerStore.weeklyLessonsRead }} /
                  {{ plannerStore.settings.weeklyLessonGoal }}
                  <q-icon
                    v-if="plannerStore.weeklyLessonsRead >= plannerStore.settings.weeklyLessonGoal"
                    name="check_circle"
                    color="positive"
                    size="xs"
                    class="q-ml-xs"
                  />
                </span>
              </div>
              <q-linear-progress
                :value="
                  Math.min(
                    1,
                    plannerStore.weeklyLessonsRead / plannerStore.settings.weeklyLessonGoal,
                  )
                "
                color="secondary"
                track-color="grey-3"
                rounded
                size="6px"
              />
            </div>
          </q-card-section>
        </q-card>

        <!-- Readiness by VMLE subject -->
        <div class="text-body2 text-weight-medium q-mb-xs">Readiness by VMLE Subject</div>
        <div class="text-caption text-grey q-mb-sm">
          Based on your accuracy so far (need ≥ 5 attempts)
        </div>

        <q-list dense bordered separator rounded>
          <q-item
            v-for="item in progressStore.accuracy"
            :key="item.subject"
            class="q-py-xs"
            :class="item.attempts >= 5 && item.pct < 60 ? 'bg-red-1' : ''"
          >
            <q-item-section>
              <q-item-label class="text-caption">{{ item.subject }}</q-item-label>
              <q-linear-progress
                v-if="item.attempts >= 5"
                :value="item.pct / 100"
                :color="readinessColor(item.pct)"
                track-color="grey-3"
                rounded
                size="5px"
                class="q-mt-xs"
              />
              <q-item-label v-else caption class="text-grey-5">Not enough data yet</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-badge
                v-if="item.attempts >= 5"
                :color="readinessColor(item.pct)"
                :label="`${item.pct}%`"
              />
              <span v-else class="text-caption text-grey-4">—</span>
            </q-item-section>
          </q-item>
        </q-list>
      </q-tab-panel>

      <!-- ── School Tasks ── -->
      <q-tab-panel name="tasks" class="q-pa-none">
        <div class="row items-center q-mb-md">
          <div class="col text-caption text-grey">
            {{ activeTasks }} active task{{ activeTasks !== 1 ? 's' : '' }}
          </div>
          <q-btn
            color="primary"
            unelevated
            no-caps
            dense
            icon="add"
            label="Add Task"
            @click="openAddDialog"
          />
        </div>

        <div v-if="plannerStore.tasks.length === 0" class="text-center text-grey q-mt-xl">
          <q-icon name="checklist" size="4rem" color="grey-3" />
          <div class="text-body1 q-mt-sm">No tasks yet</div>
          <div class="text-caption">Track homework, exams, and requirements</div>
        </div>

        <template v-else>
          <!-- Overdue -->
          <task-group
            v-if="grouped.overdue.length"
            label="OVERDUE"
            label-color="negative"
            :tasks="grouped.overdue"
            @edit="openEditDialog"
            @delete="confirmDelete"
            @status="cycleStatus"
          />

          <!-- Today -->
          <task-group
            v-if="grouped.today.length"
            label="TODAY"
            label-color="primary"
            :tasks="grouped.today"
            @edit="openEditDialog"
            @delete="confirmDelete"
            @status="cycleStatus"
          />

          <!-- This week -->
          <task-group
            v-if="grouped.thisWeek.length"
            label="THIS WEEK"
            label-color="grey-7"
            :tasks="grouped.thisWeek"
            @edit="openEditDialog"
            @delete="confirmDelete"
            @status="cycleStatus"
          />

          <!-- Later -->
          <task-group
            v-if="grouped.later.length"
            label="LATER"
            label-color="grey-7"
            :tasks="grouped.later"
            @edit="openEditDialog"
            @delete="confirmDelete"
            @status="cycleStatus"
          />

          <!-- Done (collapsible) -->
          <q-expansion-item
            v-if="grouped.done.length"
            dense
            :label="`Done (${grouped.done.length})`"
            icon="check_circle"
            header-class="text-grey text-caption"
            class="q-mt-sm"
          >
            <task-group
              :tasks="grouped.done"
              @edit="openEditDialog"
              @delete="confirmDelete"
              @status="cycleStatus"
            />
          </q-expansion-item>
        </template>
      </q-tab-panel>
    </q-tab-panels>

    <!-- ── Task add/edit dialog ── -->
    <q-dialog v-model="showTaskDialog" persistent>
      <q-card style="min-width: 320px; max-width: 480px; width: 90vw">
        <q-card-section>
          <div class="text-body1 text-weight-medium">
            {{ editingTaskId ? 'Edit Task' : 'Add Task' }}
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none q-gutter-sm">
          <q-input
            v-model="form.title"
            label="Title *"
            outlined
            dense
            autofocus
            :rules="[(v: string) => !!v || 'Required']"
          />
          <q-input v-model="form.subject" label="Subject" outlined dense />
          <div class="row q-gutter-sm">
            <q-select
              v-model="form.type"
              :options="taskTypeOptions"
              emit-value
              map-options
              label="Type"
              outlined
              dense
              class="col"
            />
            <q-select
              v-model="form.status"
              :options="taskStatusOptions"
              emit-value
              map-options
              label="Status"
              outlined
              dense
              class="col"
            />
          </div>
          <q-input
            v-model="form.dueDate"
            type="date"
            label="Due date *"
            outlined
            dense
            :rules="[(v: string) => !!v || 'Required']"
          />
          <q-input v-model="form.notes" label="Notes" outlined dense type="textarea" rows="2" />
        </q-card-section>

        <q-card-actions align="right" class="q-pb-md q-pr-md">
          <q-btn flat no-caps label="Cancel" v-close-popup />
          <q-btn
            unelevated
            no-caps
            color="primary"
            label="Save"
            :disable="!form.title.trim() || !form.dueDate"
            @click="saveTask"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- ── Exam date dialog ── -->
    <q-dialog v-model="showDateDialog">
      <q-card style="min-width: 280px">
        <q-card-section>
          <div class="text-body1 text-weight-medium">VMLE Exam Date</div>
          <div class="text-caption text-grey">Verify with PRC (prc.gov.ph)</div>
        </q-card-section>
        <q-card-section class="q-pt-none">
          <q-input v-model="examDateInput" type="date" label="Exam date" outlined dense />
        </q-card-section>
        <q-card-actions align="right" class="q-pb-md q-pr-md">
          <q-btn flat no-caps label="Cancel" v-close-popup />
          <q-btn unelevated no-caps color="primary" label="Save" @click="saveExamDate" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- ── Goal dialog ── -->
    <q-dialog v-model="showGoalDialog">
      <q-card style="min-width: 280px">
        <q-card-section>
          <div class="text-body1 text-weight-medium">Weekly Goals</div>
        </q-card-section>
        <q-card-section class="q-pt-none q-gutter-sm">
          <q-input
            v-model.number="goalForm.weeklyQuestionGoal"
            type="number"
            label="Questions per week"
            outlined
            dense
            :min="1"
          />
          <q-input
            v-model.number="goalForm.weeklyLessonGoal"
            type="number"
            label="Lessons per week"
            outlined
            dense
            :min="1"
          />
        </q-card-section>
        <q-card-actions align="right" class="q-pb-md q-pr-md">
          <q-btn flat no-caps label="Cancel" v-close-popup />
          <q-btn unelevated no-caps color="primary" label="Save" @click="saveGoals" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, defineComponent, h } from 'vue';
import { usePlannerStore } from '@/stores/plannerStore';
import { useProgressStore } from '@/stores/progressStore';
import type { SchoolTask, TaskType, TaskStatus } from '@/types/task';

const plannerStore = usePlannerStore();
const progressStore = useProgressStore();

const activeTab = ref<'study' | 'tasks'>('study');

// ── Task dialog ──────────────────────────────────────────────
const showTaskDialog = ref(false);
const editingTaskId = ref<string | null>(null);

const form = reactive<{
  title: string;
  subject: string;
  type: TaskType;
  dueDate: string;
  status: TaskStatus;
  notes: string;
}>({
  title: '',
  subject: '',
  type: 'homework',
  dueDate: '',
  status: 'todo',
  notes: '',
});

const taskTypeOptions: { label: string; value: TaskType }[] = [
  { label: 'Homework', value: 'homework' },
  { label: 'Lab', value: 'lab' },
  { label: 'Report', value: 'report' },
  { label: 'Exam', value: 'exam' },
  { label: 'Requirement', value: 'requirement' },
];

const taskStatusOptions: { label: string; value: TaskStatus }[] = [
  { label: 'To Do', value: 'todo' },
  { label: 'Doing', value: 'doing' },
  { label: 'Done', value: 'done' },
];

function resetForm() {
  const today = new Date().toISOString().slice(0, 10);
  form.title = '';
  form.subject = '';
  form.type = 'homework';
  form.dueDate = today;
  form.status = 'todo';
  form.notes = '';
}

function openAddDialog() {
  editingTaskId.value = null;
  resetForm();
  showTaskDialog.value = true;
}

function openEditDialog(task: SchoolTask) {
  editingTaskId.value = task.id;
  form.title = task.title;
  form.subject = task.subject;
  form.type = task.type;
  form.dueDate = new Date(task.dueAt).toISOString().slice(0, 10);
  form.status = task.status;
  form.notes = task.notes ?? '';
  showTaskDialog.value = true;
}

async function saveTask() {
  if (!form.title.trim() || !form.dueDate) return;
  const dueAt = new Date(form.dueDate + 'T00:00:00').getTime();
  const trimmedNotes = form.notes.trim();
  const data = {
    title: form.title.trim(),
    subject: form.subject.trim(),
    type: form.type,
    dueAt,
    status: form.status,
    ...(trimmedNotes ? { notes: trimmedNotes } : {}),
  };

  if (editingTaskId.value) {
    const existing = plannerStore.tasks.find((t) => t.id === editingTaskId.value)!;
    await plannerStore.updateTask({ ...existing, ...data });
  } else {
    await plannerStore.addTask(data);
  }
  showTaskDialog.value = false;
}

async function confirmDelete(task: SchoolTask) {
  await plannerStore.deleteTask(task.id);
}

async function cycleStatus(task: SchoolTask) {
  const next: TaskStatus =
    task.status === 'todo' ? 'doing' : task.status === 'doing' ? 'done' : 'todo';
  await plannerStore.updateTask({ ...task, status: next });
}

// ── Computed groupings ───────────────────────────────────────
const grouped = computed(() => plannerStore.groupedTasks());
const activeTasks = computed(
  () =>
    grouped.value.overdue.length +
    grouped.value.today.length +
    grouped.value.thisWeek.length +
    grouped.value.later.length,
);

// ── Exam date dialog ─────────────────────────────────────────
const showDateDialog = ref(false);
const examDateInput = ref('');

function openDateDialog() {
  examDateInput.value = plannerStore.settings.examDate
    ? new Date(plannerStore.settings.examDate).toISOString().slice(0, 10)
    : '';
  showDateDialog.value = true;
}

async function saveExamDate() {
  const ms = examDateInput.value
    ? new Date(examDateInput.value + 'T00:00:00').getTime()
    : undefined;
  const settings = { ...plannerStore.settings };
  if (ms !== undefined) {
    settings.examDate = ms;
  } else {
    delete settings.examDate;
  }
  await plannerStore.saveSettings(settings);
  showDateDialog.value = false;
}

// ── Goal dialog ──────────────────────────────────────────────
const showGoalDialog = ref(false);
const goalForm = reactive({ weeklyQuestionGoal: 50, weeklyLessonGoal: 3 });

function openGoalDialog() {
  goalForm.weeklyQuestionGoal = plannerStore.settings.weeklyQuestionGoal;
  goalForm.weeklyLessonGoal = plannerStore.settings.weeklyLessonGoal;
  showGoalDialog.value = true;
}

async function saveGoals() {
  await plannerStore.saveSettings({
    ...plannerStore.settings,
    weeklyQuestionGoal: Math.max(1, goalForm.weeklyQuestionGoal),
    weeklyLessonGoal: Math.max(1, goalForm.weeklyLessonGoal),
  });
  showGoalDialog.value = false;
}

// ── Readiness color ──────────────────────────────────────────
function readinessColor(pct: number): string {
  if (pct >= 75) return 'positive';
  if (pct >= 50) return 'warning';
  return 'negative';
}

// ── TaskGroup inline component ───────────────────────────────
const typeIcon: Record<TaskType, string> = {
  homework: 'menu_book',
  lab: 'science',
  report: 'description',
  exam: 'quiz',
  requirement: 'checklist',
};

const statusColor: Record<TaskStatus, string> = {
  todo: 'grey-5',
  doing: 'primary',
  done: 'positive',
};

function fmtDate(ms: number): string {
  return new Date(ms).toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function isOverdue(task: SchoolTask): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return task.status !== 'done' && task.dueAt < today.getTime();
}

// Inline TaskGroup component to avoid separate file
const TaskGroup = defineComponent({
  props: {
    tasks: { type: Array as () => SchoolTask[], required: true },
    label: { type: String, default: '' },
    labelColor: { type: String, default: 'grey-7' },
  },
  emits: ['edit', 'delete', 'status'],
  setup(props, { emit }) {
    return () =>
      h('div', { class: 'q-mb-md' }, [
        props.label
          ? h(
              'div',
              { class: `text-caption text-weight-medium text-${props.labelColor} q-mb-xs` },
              props.label,
            )
          : null,
        h(
          'q-list',
          { dense: true, bordered: true, separator: true, rounded: true },
          props.tasks.map((task) =>
            h('q-item', { key: task.id, class: 'q-py-sm' }, [
              h('q-item-section', { avatar: true }, [
                h('q-btn', {
                  flat: true,
                  round: true,
                  dense: true,
                  icon: typeIcon[task.type],
                  color: statusColor[task.status],
                  size: 'sm',
                  title: `Status: ${task.status} — click to cycle`,
                  onClick: () => emit('status', task),
                }),
              ]),
              h('q-item-section', null, [
                h(
                  'q-item-label',
                  { class: task.status === 'done' ? 'text-grey text-strike' : '' },
                  task.title,
                ),
                h('q-item-label', { caption: true }, [
                  task.subject ? h('span', { class: 'q-mr-sm' }, task.subject) : null,
                  h(
                    'span',
                    { class: isOverdue(task) ? 'text-negative' : 'text-grey-6' },
                    fmtDate(task.dueAt),
                  ),
                ]),
              ]),
              h('q-item-section', { side: true }, [
                h('div', { class: 'row q-gutter-xs' }, [
                  h('q-btn', {
                    flat: true,
                    round: true,
                    dense: true,
                    icon: 'edit',
                    size: 'xs',
                    onClick: () => emit('edit', task),
                  }),
                  h('q-btn', {
                    flat: true,
                    round: true,
                    dense: true,
                    icon: 'delete',
                    color: 'negative',
                    size: 'xs',
                    onClick: () => emit('delete', task),
                  }),
                ]),
              ]),
            ]),
          ),
        ),
      ]);
  },
});

onMounted(async () => {
  await Promise.all([plannerStore.load(), progressStore.refresh()]);
});
</script>
