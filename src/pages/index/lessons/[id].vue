<template>
  <q-page v-if="lesson" class="q-pa-md" style="max-width: 720px; margin: 0 auto">
    <!-- Back + status row -->
    <div class="row items-center q-mb-sm">
      <q-btn flat round dense icon="arrow_back" to="/lessons" class="q-mr-sm" />
      <div class="col">
        <div class="text-h6">{{ lesson.topic }}</div>
        <div class="text-caption text-grey">{{ lesson.subject }} · Year {{ lesson.year }}</div>
      </div>
    </div>

    <!-- Subject badge -->
    <q-chip dense color="primary" text-color="white" class="q-mb-md text-caption">
      {{ lesson.vmleSubject }}
    </q-chip>

    <!-- Read status toggle -->
    <div class="row q-gutter-sm q-mb-lg">
      <q-btn
        v-for="s in statusOptions"
        :key="s.value"
        dense
        no-caps
        unelevated
        :color="currentStatus === s.value ? s.color : 'grey-3'"
        :text-color="currentStatus === s.value ? 'white' : 'grey-7'"
        :label="s.label"
        :icon="s.icon"
        @click="setStatus(s.value)"
      />
    </div>

    <!-- Objectives -->
    <q-card flat bordered class="q-mb-md">
      <q-card-section class="q-py-sm">
        <div class="text-caption text-weight-medium text-grey-7 q-mb-xs">LEARNING OBJECTIVES</div>
        <ul class="q-ma-none q-pl-md">
          <li v-for="(obj, i) in lesson.objectives" :key="i" class="text-body2 q-mb-xs">
            {{ obj }}
          </li>
        </ul>
      </q-card-section>
    </q-card>

    <!-- Content sections -->
    <q-expansion-item
      default-opened
      icon="info_outline"
      label="Overview"
      header-class="text-weight-medium"
      class="q-mb-xs"
    >
      <q-card flat>
        <q-card-section>
          <!-- eslint-disable-next-line vue/no-v-html -->
          <div class="lesson-body" v-html="renderMd(lesson.overview)" />
        </q-card-section>
      </q-card>
    </q-expansion-item>

    <q-expansion-item
      default-opened
      icon="abc"
      label="Key Terms"
      header-class="text-weight-medium"
      class="q-mb-xs"
    >
      <q-card flat>
        <q-list dense separator>
          <q-item v-for="kt in lesson.keyTerms" :key="kt.term" class="q-py-sm">
            <q-item-section>
              <q-item-label class="text-body2 text-weight-medium">{{ kt.term }}</q-item-label>
              <q-item-label caption class="text-grey-7">{{ kt.definition }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card>
    </q-expansion-item>

    <q-expansion-item
      icon="article"
      label="Content"
      header-class="text-weight-medium"
      class="q-mb-xs"
    >
      <q-card flat>
        <q-card-section>
          <!-- eslint-disable-next-line vue/no-v-html -->
          <div class="lesson-body" v-html="renderMd(lesson.content)" />
        </q-card-section>
      </q-card>
    </q-expansion-item>

    <q-expansion-item
      icon="star"
      label="High-Yield (VMLE)"
      header-class="text-weight-medium text-warning"
      class="q-mb-xs"
    >
      <q-card flat class="bg-amber-1">
        <q-card-section>
          <!-- eslint-disable-next-line vue/no-v-html -->
          <div class="lesson-body" v-html="renderMd(lesson.highYield)" />
        </q-card-section>
      </q-card>
    </q-expansion-item>

    <q-expansion-item
      v-if="lesson.mnemonics"
      icon="lightbulb_outline"
      label="Mnemonics"
      header-class="text-weight-medium text-positive"
      class="q-mb-xs"
    >
      <q-card flat class="bg-green-1">
        <q-card-section>
          <!-- eslint-disable-next-line vue/no-v-html -->
          <div class="lesson-body" v-html="renderMd(lesson.mnemonics)" />
        </q-card-section>
      </q-card>
    </q-expansion-item>

    <!-- Diagrams -->
    <template v-if="lesson.diagrams && lesson.diagrams.length > 0">
      <q-expansion-item
        v-for="diagram in lesson.diagrams"
        :key="diagram.title"
        icon="account_tree"
        :label="diagram.title"
        header-class="text-weight-medium text-deep-purple"
        class="q-mb-xs"
      >
        <q-card flat class="bg-deep-purple-1">
          <q-card-section>
            <MermaidDiagram :diagram="diagram.mermaid" />
          </q-card-section>
        </q-card>
      </q-expansion-item>
    </template>

    <q-separator class="q-my-md" />

    <!-- Personal Notes -->
    <div class="text-body2 text-weight-medium q-mb-sm">
      <q-icon name="edit_note" class="q-mr-xs" />
      My Notes
    </div>

    <q-tabs
      v-model="notesTab"
      dense
      align="left"
      active-color="primary"
      indicator-color="primary"
      class="q-mb-sm text-grey-7"
    >
      <q-tab name="write" label="Write" icon="edit" no-caps />
      <q-tab name="preview" label="Preview" icon="visibility" no-caps />
    </q-tabs>

    <q-tab-panels v-model="notesTab" animated>
      <q-tab-panel name="write" class="q-pa-none">
        <q-input
          v-model="noteBody"
          type="textarea"
          outlined
          placeholder="Write notes, mnemonics, or anything you want to remember…"
          rows="6"
          style="font-family: monospace; font-size: 13px"
          @update:model-value="scheduleNoteSave"
        />
        <div class="text-caption text-grey q-mt-xs">Supports markdown. Auto-saved.</div>
      </q-tab-panel>

      <q-tab-panel name="preview" class="q-pa-sm">
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div
          v-if="noteBody.trim()"
          class="lesson-body"
          style="min-height: 120px"
          v-html="renderMd(noteBody)"
        />
        <div v-else class="text-grey text-caption q-pa-sm">Nothing to preview yet.</div>
      </q-tab-panel>
    </q-tab-panels>

    <q-separator class="q-my-md" />

    <!-- Practice button -->
    <q-btn
      color="primary"
      unelevated
      no-caps
      class="full-width"
      style="min-height: 48px"
      :disable="availableQuestions.length === 0"
      @click="practiceLesson"
    >
      <q-icon name="quiz" class="q-mr-sm" />
      Practice This Topic
      <span v-if="availableQuestions.length > 0" class="q-ml-xs text-caption opacity-80">
        ({{ availableQuestions.length }} question{{ availableQuestions.length !== 1 ? 's' : '' }})
      </span>
      <span v-else class="q-ml-xs text-caption opacity-80">(no questions yet)</span>
    </q-btn>

    <div v-if="lesson.checkQuestions.length > 0" class="text-caption text-grey q-mt-xs text-center">
      {{ matchedCheckQuestions }} curated + {{ extraSubjectQuestions }} from subject pool
    </div>

    <!-- Flashcard Mode button -->
    <q-btn
      v-if="lesson.keyTerms.length > 0"
      color="deep-purple"
      flat
      no-caps
      class="full-width q-mt-sm"
      style="min-height: 44px"
      :to="`/flashcards/${lesson.id}`"
    >
      <q-icon name="style" class="q-mr-sm" />
      Flashcard Mode
      <span class="q-ml-xs text-caption opacity-80">
        ({{ lesson.keyTerms.length }} term{{ lesson.keyTerms.length !== 1 ? 's' : '' }})
      </span>
    </q-btn>
  </q-page>

  <!-- 404 state -->
  <q-page v-else class="flex flex-center">
    <div class="text-center">
      <q-icon name="search_off" size="4rem" color="grey-4" />
      <div class="text-body1 q-mt-sm text-grey">Lesson not found</div>
      <q-btn flat color="primary" label="Back to Lessons" to="/lessons" no-caps class="q-mt-sm" />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import MermaidDiagram from '@/components/MermaidDiagram.vue';
import { useLessonStore } from '@/stores/lessonStore';
import { useQuestionStore } from '@/stores/questionStore';
import { useQuizStore } from '@/stores/quizStore';
import { localRepository } from '@/db/repository';
import type { LessonStatus } from '@/types/lesson';
import type { Question } from '@/types/question';

const route = useRoute();
const router = useRouter();
const lessonStore = useLessonStore();
const questionStore = useQuestionStore();
const quizStore = useQuizStore();

const lessonId = computed(() => (route.params as unknown as { id: string }).id);
const lesson = computed(() => lessonStore.lessons.find((l) => l.id === lessonId.value) ?? null);
const currentStatus = computed(() => lessonStore.getStatus(lessonId.value));

const notesTab = ref<'write' | 'preview'>('write');
const noteBody = ref('');
let saveTimer: ReturnType<typeof setTimeout> | null = null;

const statusOptions: { value: LessonStatus; label: string; icon: string; color: string }[] = [
  { value: 'unread', label: 'Unread', icon: 'radio_button_unchecked', color: 'grey-5' },
  { value: 'read', label: 'Read', icon: 'check_circle_outline', color: 'primary' },
  { value: 'reviewed', label: 'Reviewed', icon: 'check_circle', color: 'positive' },
];

function renderMd(md: string): string {
  return DOMPurify.sanitize(marked.parse(md) as string);
}

async function setStatus(status: LessonStatus) {
  await lessonStore.setStatus(lessonId.value, status);
}

function scheduleNoteSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    void localRepository.saveLessonNote(lessonId.value, noteBody.value);
  }, 800);
}

onUnmounted(() => {
  if (saveTimer) clearTimeout(saveTimer);
});

// Questions for "Practice This Topic"
const questionById = computed(
  () => new Map<string, Question>(questionStore.questions.map((q) => [q.id, q])),
);

const curated = computed(() =>
  (lesson.value?.checkQuestions ?? [])
    .map((id) => questionById.value.get(id))
    .filter((q): q is Question => !!q),
);

const curatedIds = computed(() => new Set(curated.value.map((q) => q.id)));

const subjectPool = computed(() =>
  questionStore.questions.filter(
    (q) => q.vmleSubject === lesson.value?.vmleSubject && !curatedIds.value.has(q.id),
  ),
);

const availableQuestions = computed(() => {
  const combined = [...curated.value, ...subjectPool.value];
  return shuffle(combined).slice(0, 20);
});

const matchedCheckQuestions = computed(() => curated.value.length);
const extraSubjectQuestions = computed(() =>
  Math.min(subjectPool.value.length, 20 - curated.value.length),
);

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i]!;
    a[i] = a[j]!;
    a[j] = tmp;
  }
  return a;
}

function practiceLesson() {
  if (!lesson.value || availableQuestions.value.length === 0) return;
  quizStore.startQuiz(availableQuestions.value, {
    type: 'course',
    label: `Lesson: ${lesson.value.topic}`,
  });
  void router.push('/quiz');
}

onMounted(async () => {
  await lessonStore.loadStatuses();
  await questionStore.loadAll();
  const note = await localRepository.getLessonNote(lessonId.value);
  if (note) noteBody.value = note.bodyMd;
});
</script>

<style scoped>
.lesson-body :deep(h2) {
  font-size: 1rem;
  font-weight: 600;
  margin: 1rem 0 0.5rem;
}
.lesson-body :deep(h3) {
  font-size: 0.9rem;
  font-weight: 600;
  margin: 0.8rem 0 0.4rem;
}
.lesson-body :deep(p) {
  margin: 0.4rem 0;
  font-size: 0.875rem;
  line-height: 1.6;
}
.lesson-body :deep(ul),
.lesson-body :deep(ol) {
  padding-left: 1.2rem;
  margin: 0.4rem 0;
  font-size: 0.875rem;
}
.lesson-body :deep(li) {
  margin-bottom: 0.25rem;
  line-height: 1.5;
}
.lesson-body :deep(table) {
  border-collapse: collapse;
  width: 100%;
  font-size: 0.8rem;
  margin: 0.5rem 0;
}
.lesson-body :deep(th),
.lesson-body :deep(td) {
  border: 1px solid #ddd;
  padding: 4px 8px;
  text-align: left;
}
.lesson-body :deep(th) {
  background: #f5f5f5;
  font-weight: 600;
}
.lesson-body :deep(strong) {
  font-weight: 600;
}
.lesson-body :deep(blockquote) {
  border-left: 3px solid #ccc;
  margin: 0.5rem 0;
  padding-left: 0.8rem;
  color: #666;
  font-style: italic;
}
.lesson-body :deep(code) {
  background: #f0f0f0;
  padding: 1px 4px;
  border-radius: 3px;
  font-family: monospace;
  font-size: 0.85em;
}
</style>
