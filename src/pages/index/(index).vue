<template>
  <q-page class="q-pa-md">
    <div class="row q-mb-md">
      <q-btn-toggle
        v-model="mode"
        spread
        no-caps
        rounded
        unelevated
        :options="[
          { label: 'By exam topic', value: 'exam', icon: 'assignment' },
          { label: 'By my course',  value: 'course', icon: 'school' },
        ]"
        color="grey-2"
        text-color="grey-7"
        toggle-color="primary"
        toggle-text-color="white"
        class="full-width"
        style="min-height: 44px"
      />
    </div>

    <!-- Medical disclaimer -->
    <q-banner rounded dense class="text-caption q-mb-md disclaimer-banner">
      <template #avatar>
        <q-icon name="verified_user" color="teal-6" size="xs" />
      </template>
      For study purposes only — not clinical guidance. Verify all content before use.
    </q-banner>

    <div v-if="questionStore.loading" class="text-center q-py-xl">
      <q-spinner color="primary" size="2rem" />
      <div class="text-caption text-grey q-mt-sm">Loading questions…</div>
    </div>

    <template v-else>
      <!-- ── Exam topic view ───────────────────────────────────────── -->
      <div v-if="mode === 'exam'">
        <q-expansion-item
          v-for="subject in tosData.subjects"
          :key="subject.name"
          :label="subject.name"
          :caption="`${subject.examWeightPct}% of exam · ${countBySubject(subject.name)} Qs`"
          header-class="text-weight-medium"
          expand-separator
          class="dvmr-subject-item"
          :style="{ borderLeftColor: subjectColor(subject.name) }"
        >
          <template #header>
            <q-item-section avatar style="min-width: 0; padding-right: 12px">
              <span
                class="subject-dot"
                :style="{ background: subjectColor(subject.name) }"
              />
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-weight-semibold" style="font-size: 0.875rem">
                {{ subject.name }}
              </q-item-label>
              <q-item-label caption class="text-grey-6">
                {{ subject.examWeightPct }}% of exam &middot;
                <span :class="countBySubject(subject.name) > 0 ? 'text-primary text-weight-medium' : ''">
                  {{ countBySubject(subject.name) }} Qs
                </span>
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-icon name="expand_more" color="grey-5" size="xs" />
            </q-item-section>
          </template>

          <q-list>
            <q-expansion-item
              v-for="section in subject.sections"
              :key="section.id"
              :label="`${section.id}. ${section.name}`"
              :caption="`${section.weight}% of subject`"
              dense
              header-class="q-pl-lg text-grey-8 text-caption"
              expand-separator
            >
              <q-list dense>
                <template v-for="topic in section.topics" :key="topic.id">
                  <!-- Topics without sub-competencies -->
                  <template v-if="!topic.sub || topic.sub.length === 0">
                    <q-item
                      clickable
                      v-ripple
                      class="q-pl-xl topic-item"
                      @click="startExamQuiz(subject.name, section.id, topic.id, topic.text)"
                    >
                      <q-item-section>
                        <q-item-label class="text-body2">
                          {{ section.id }}.{{ topic.id }} {{ topic.text }}
                        </q-item-label>
                        <q-item-label caption>{{ topic.items }} exam items</q-item-label>
                      </q-item-section>
                      <q-item-section side class="row items-center q-gutter-xs">
                        <q-btn
                          flat round dense icon="hub" color="grey-4" size="xs"
                          :aria-label="`Hub for ${section.id}.${topic.id}`"
                          @click.stop="openHub(`${subject.name}:${section.id}.${topic.id}`)"
                        />
                        <q-btn
                          flat round dense icon="edit_note" color="grey-4" size="xs"
                          :aria-label="`Notes for ${section.id}.${topic.id}`"
                          @click.stop="openNote(`${subject.name}:${section.id}.${topic.id}`)"
                        />
                        <q-chip
                          dense size="sm"
                          :color="countForCompetency(`${subject.name}:${section.id}.${topic.id}`) > 0 ? 'primary' : 'grey-2'"
                          :text-color="countForCompetency(`${subject.name}:${section.id}.${topic.id}`) > 0 ? 'white' : 'grey-6'"
                          style="font-size: 0.7rem; height: 20px"
                        >
                          {{ countForCompetency(`${subject.name}:${section.id}.${topic.id}`) }} Q
                        </q-chip>
                      </q-item-section>
                    </q-item>
                  </template>

                  <!-- Topics with sub-competencies -->
                  <template v-else>
                    <q-item class="q-pl-xl" dense>
                      <q-item-section>
                        <q-item-label class="text-caption text-grey-5 text-weight-medium" style="text-transform: uppercase; letter-spacing: 0.04em">
                          {{ section.id }}.{{ topic.id }} {{ topic.text }}
                        </q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-item
                      v-for="sub in topic.sub"
                      :key="sub.id"
                      clickable
                      v-ripple
                      class="q-pl-xl q-ml-md topic-item"
                      @click="startExamQuiz(subject.name, section.id, sub.id, sub.text)"
                    >
                      <q-item-section>
                        <q-item-label class="text-body2">
                          {{ section.id }}.{{ sub.id }} {{ sub.text }}
                        </q-item-label>
                        <q-item-label caption>{{ sub.items }} exam items</q-item-label>
                      </q-item-section>
                      <q-item-section side class="row items-center q-gutter-xs">
                        <q-btn
                          flat round dense icon="hub" color="grey-4" size="xs"
                          :aria-label="`Hub for ${section.id}.${sub.id}`"
                          @click.stop="openHub(`${subject.name}:${section.id}.${sub.id}`)"
                        />
                        <q-btn
                          flat round dense icon="edit_note" color="grey-4" size="xs"
                          :aria-label="`Notes for ${section.id}.${sub.id}`"
                          @click.stop="openNote(`${subject.name}:${section.id}.${sub.id}`)"
                        />
                        <q-chip
                          dense size="sm"
                          :color="countForCompetency(`${subject.name}:${section.id}.${sub.id}`) > 0 ? 'primary' : 'grey-2'"
                          :text-color="countForCompetency(`${subject.name}:${section.id}.${sub.id}`) > 0 ? 'white' : 'grey-6'"
                          style="font-size: 0.7rem; height: 20px"
                        >
                          {{ countForCompetency(`${subject.name}:${section.id}.${sub.id}`) }} Q
                        </q-chip>
                      </q-item-section>
                    </q-item>
                  </template>
                </template>
              </q-list>
            </q-expansion-item>
          </q-list>
        </q-expansion-item>
      </div>

      <!-- ── Course view ──────────────────────────────────────────── -->
      <div v-else>
        <q-select
          v-model="selectedSchool"
          :options="schoolOptions"
          label="Select your school"
          outlined
          dense
          emit-value
          map-options
          class="q-mb-md"
          style="border-radius: 8px"
        />

        <template v-if="selectedSchool">
          <q-expansion-item
            v-for="year in yearsForSchool"
            :key="year"
            :label="year === 0 ? 'Pre-DVM (Year 0)' : `Year ${year}`"
            icon="calendar_today"
            header-class="text-weight-semibold"
            expand-separator
            class="dvmr-subject-item"
            style="border-left-color: #0d9488"
          >
            <q-list>
              <q-expansion-item
                v-for="sem in semsForYear(year)"
                :key="sem"
                :label="sem === 0 ? 'Mid-year' : `Semester ${sem}`"
                dense
                header-class="q-pl-lg text-grey-8"
                expand-separator
              >
                <q-list dense>
                  <q-item
                    v-for="course in coursesForSem(year, sem)"
                    :key="course.name"
                    clickable
                    v-ripple
                    class="q-pl-xl topic-item"
                    @click="startCourseQuiz(course)"
                  >
                    <q-item-section>
                      <q-item-label class="text-body2">{{ course.name }}</q-item-label>
                      <q-item-label caption>
                        {{ course.units }} units &middot; {{ course.vmleSubject }}
                      </q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <q-chip
                        dense
                        size="sm"
                        :color="countForCourse(course.name) > 0 ? 'primary' : 'grey-2'"
                        :text-color="countForCourse(course.name) > 0 ? 'white' : 'grey-6'"
                        style="font-size: 0.7rem; height: 20px"
                      >
                        {{ countForCourse(course.name) }} Q
                      </q-chip>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-expansion-item>
            </q-list>
          </q-expansion-item>
        </template>

        <div v-else class="text-center text-grey q-mt-xl q-py-xl">
          <q-icon name="school" size="3.5rem" color="grey-3" />
          <div class="text-subtitle2 q-mt-md text-grey-6">Select a school to browse its curriculum</div>
          <div class="text-caption text-grey-5 q-mt-xs">UPLB, CLSU, PSAU, or CHED sample</div>
        </div>
      </div>
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useBrowseMode } from '@/composables/useBrowseMode';
import { loadTos } from '@/data/loaders/tos';
import {
  getYearsForSchool,
  getSemestersForYear,
  getCoursesForSemester,
  SCHOOL_LABELS,
} from '@/data/loaders/curriculum';
import { useQuizStore } from '@/stores/quizStore';
import { useQuestionStore } from '@/stores/questionStore';
import type { SchoolKey, ResolvedCourse } from '@/types/curriculum';
import type { Question } from '@/types/question';

const tosData = loadTos();
const { mode } = useBrowseMode();
const router = useRouter();
const quizStore = useQuizStore();
const questionStore = useQuestionStore();

onMounted(() => void questionStore.loadAll());

// ── Subject color map ────────────────────────────────────────────────
const SUBJECT_COLORS: Record<string, string> = {
  'Veterinary Anatomy':                       '#6366f1',
  'Veterinary Physiology':                    '#0ea5e9',
  'Zootechnics':                              '#10b981',
  'Veterinary Pathology':                     '#f43f5e',
  'Veterinary Pharmacology':                  '#a855f7',
  'Veterinary Medicine':                      '#3b82f6',
  'Veterinary Microbiology and Public Health':'#f59e0b',
  'Veterinary Parasitology':                  '#22c55e',
  'Veterinary Surgery':                       '#ef4444',
};

function subjectColor(name: string): string {
  return SUBJECT_COLORS[name] ?? '#94a3b8';
}

// ── Exam-topic view ──────────────────────────────────────────────────
const questionsByCompetency = computed(() => {
  const map = new Map<string, Question[]>();
  for (const q of questionStore.questions) {
    const existing = map.get(q.competencyId) ?? [];
    existing.push(q);
    map.set(q.competencyId, existing);
  }
  return map;
});

const questionsBySubject = computed(() => {
  const map = new Map<string, number>();
  for (const q of questionStore.questions) {
    map.set(q.vmleSubject, (map.get(q.vmleSubject) ?? 0) + 1);
  }
  return map;
});

function countBySubject(subjectName: string): number {
  return questionsBySubject.value.get(subjectName) ?? 0;
}

function countForCompetency(competencyId: string): number {
  return questionsByCompetency.value.get(competencyId)?.length ?? 0;
}

function openNote(competencyId: string) {
  void router.push(`/notes/${encodeURIComponent(competencyId)}`);
}

function openHub(competencyId: string) {
  void router.push(`/hub/${encodeURIComponent(competencyId)}`);
}

function startExamQuiz(subjectName: string, sectionId: string, topicId: string, topicText: string) {
  const competencyId = `${subjectName}:${sectionId}.${topicId}`;
  const qs = questionsByCompetency.value.get(competencyId) ?? [];
  if (qs.length === 0) return;
  quizStore.startQuiz(qs, {
    type: 'competency',
    label: `${subjectName} — ${topicText}`,
    competencyId,
  });
  void router.push('/quiz');
}

// ── Course view ──────────────────────────────────────────────────────
const schoolOptions = Object.entries(SCHOOL_LABELS).map(([value, label]) => ({ value, label }));
const selectedSchool = ref<SchoolKey | null>(null);

const yearsForSchool = computed(() =>
  selectedSchool.value ? getYearsForSchool(selectedSchool.value) : [],
);
function semsForYear(year: number): number[] {
  return selectedSchool.value ? getSemestersForYear(selectedSchool.value, year) : [];
}
function coursesForSem(year: number, sem: number): ResolvedCourse[] {
  return selectedSchool.value ? getCoursesForSemester(selectedSchool.value, year, sem) : [];
}

const questionsByCourse = computed(() => {
  const map = new Map<string, Question[]>();
  for (const q of questionStore.questions) {
    const existing = map.get(q.subject) ?? [];
    existing.push(q);
    map.set(q.subject, existing);
  }
  return map;
});

function countForCourse(courseName: string): number {
  return questionsByCourse.value.get(courseName)?.length ?? 0;
}

function startCourseQuiz(course: ResolvedCourse) {
  const qs = questionsByCourse.value.get(course.name) ?? [];
  if (qs.length === 0) return;
  quizStore.startQuiz(qs, {
    type: 'course',
    label: `${course.school} · Year ${course.year} · ${course.name}`,
    school: course.school,
    year: course.year,
    semester: course.semester,
    courseName: course.name,
  });
  void router.push('/quiz');
}
</script>

<style scoped>
.disclaimer-banner {
  background: #f0fdf4;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.body--dark .disclaimer-banner {
  background: rgba(16, 185, 129, 0.08);
  color: #6ee7b7;
  border-color: rgba(16, 185, 129, 0.2);
}

.subject-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: block;
  flex-shrink: 0;
}

.topic-item {
  transition: background 0.1s ease;
}

/* Expand icon rotation is handled by Quasar */
</style>
