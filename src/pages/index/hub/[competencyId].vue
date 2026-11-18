<template>
  <q-page class="column" style="max-width: 720px; margin: 0 auto">
    <!-- Header -->
    <div class="row items-center q-px-md q-pt-md q-pb-sm">
      <q-btn flat round dense icon="arrow_back" color="grey-7" @click="router.back()" />
      <div class="col q-ml-sm">
        <div class="text-caption text-grey-6 ellipsis" style="max-width: 280px">
          {{ competencyId }}
        </div>
        <div v-if="resolved" class="text-body2 text-weight-medium ellipsis">
          {{ resolved.text }}
        </div>
      </div>
      <q-chip v-if="resolved" dense color="primary" text-color="white" size="sm" class="q-ml-xs">
        {{ resolved.subject.split(' ')[1] ?? resolved.subject }}
      </q-chip>
    </div>

    <q-separator />

    <!-- Tabs -->
    <q-tabs
      v-model="activeTab"
      dense
      align="left"
      active-color="primary"
      indicator-color="primary"
      class="q-px-md"
    >
      <q-tab name="overview" label="Overview" no-caps />
      <q-tab name="practice" label="Practice" no-caps />
      <q-tab name="notes" label="Notes" no-caps />
      <q-tab name="resources" :label="`Resources (${resources.length})`" no-caps />
    </q-tabs>

    <q-tab-panels v-model="activeTab" animated class="col">
      <!-- ── Overview ─────────────────────────────────────────── -->
      <q-tab-panel name="overview" class="q-pa-md">
        <!-- Quick actions -->
        <div class="row q-gutter-sm q-mb-md">
          <q-btn
            unelevated
            no-caps
            color="primary"
            icon="edit_note"
            label="Notes"
            @click="router.push(`/notes/${encodeURIComponent(competencyId)}`)"
          />
          <q-btn
            v-if="clozeCount > 0"
            unelevated
            no-caps
            color="secondary"
            icon="flash_on"
            label="Drill Cards"
            @click="router.push(`/cloze/${encodeURIComponent(competencyId)}`)"
          />
          <q-btn
            v-if="hasNote"
            unelevated
            no-caps
            color="accent"
            icon="psychology"
            label="Blurt"
            @click="router.push(`/blurt/${encodeURIComponent(competencyId)}`)"
          />
          <q-btn
            v-if="questionCount > 0"
            unelevated
            no-caps
            color="orange"
            icon="quiz"
            label="Quiz"
            @click="startQuiz"
          />
        </div>

        <!-- Stats grid -->
        <div class="stat-grid q-mb-md">
          <div class="stat-chip">
            <div class="text-caption text-grey-5">Questions</div>
            <div class="text-h6 text-weight-bold">{{ questionCount }}</div>
          </div>
          <div class="stat-chip">
            <div class="text-caption text-grey-5">Cloze cards</div>
            <div class="text-h6 text-weight-bold">{{ clozeCount }}</div>
          </div>
          <div class="stat-chip">
            <div class="text-caption text-grey-5">Blurt sessions</div>
            <div class="text-h6 text-weight-bold">{{ blurtCount }}</div>
          </div>
          <div class="stat-chip">
            <div class="text-caption text-grey-5">Resources</div>
            <div class="text-h6 text-weight-bold">{{ resources.length }}</div>
          </div>
        </div>

        <!-- TOS info -->
        <template v-if="resolved">
          <div class="text-subtitle2 text-grey-7 q-mb-xs">Exam info</div>
          <q-card class="dvmr-card q-pa-sm q-mb-md">
            <div class="row q-gutter-sm text-caption">
              <span><b>Subject:</b> {{ resolved.subject }}</span>
              <span>·</span>
              <span><b>Items:</b> {{ resolved.items }} / 100</span>
            </div>
          </q-card>
        </template>

        <!-- Mistake summary -->
        <template v-if="mistakeCount > 0">
          <div class="text-subtitle2 text-grey-7 q-mb-xs">Mistake summary</div>
          <q-card class="dvmr-card q-mb-md">
            <q-list dense>
              <q-item v-for="(count, reason) in mistakeReasons" :key="reason">
                <q-item-section>{{ reason }}</q-item-section>
                <q-item-section side>
                  <q-badge color="negative" :label="count" />
                </q-item-section>
              </q-item>
            </q-list>
          </q-card>
        </template>
      </q-tab-panel>

      <!-- ── Practice ──────────────────────────────────────────── -->
      <q-tab-panel name="practice" class="q-pa-md">
        <div v-if="competencyQuestions.length === 0" class="text-center text-grey-5 q-pa-xl">
          <q-icon name="quiz" size="3rem" color="grey-3" />
          <div class="q-mt-sm">No questions tagged to this competency.</div>
        </div>
        <template v-else>
          <div class="row items-center q-mb-sm">
            <div class="text-caption text-grey-6 col">
              {{ competencyQuestions.length }} question{{
                competencyQuestions.length !== 1 ? 's' : ''
              }}
            </div>
            <q-btn
              unelevated
              no-caps
              color="primary"
              label="Quiz all"
              size="sm"
              @click="startQuiz"
            />
          </div>
          <q-card
            v-for="q in competencyQuestions.slice(0, 20)"
            :key="q.id"
            class="dvmr-card q-mb-sm"
          >
            <q-card-section class="q-py-sm">
              <div class="text-body2 ellipsis-2-lines">{{ q.stem }}</div>
              <div class="text-caption text-grey-6 q-mt-xs">{{ q.vmleSubject }}</div>
            </q-card-section>
          </q-card>
          <div
            v-if="competencyQuestions.length > 20"
            class="text-caption text-grey-5 text-center q-pt-sm"
          >
            + {{ competencyQuestions.length - 20 }} more
          </div>
        </template>
      </q-tab-panel>

      <!-- ── Notes ─────────────────────────────────────────────── -->
      <q-tab-panel name="notes" class="q-pa-md">
        <div v-if="!hasNote" class="text-center text-grey-5 q-pa-xl">
          <q-icon name="edit_note" size="3rem" color="grey-3" />
          <div class="q-mt-sm">No notes yet.</div>
          <q-btn
            unelevated
            no-caps
            color="primary"
            label="Create note"
            class="q-mt-md"
            @click="router.push(`/notes/${encodeURIComponent(competencyId)}`)"
          />
        </div>
        <template v-else>
          <div class="row items-center q-mb-sm">
            <div class="col text-caption text-grey-6">Last updated {{ noteAge }}</div>
            <q-btn
              flat
              no-caps
              color="primary"
              label="Edit"
              size="sm"
              @click="router.push(`/notes/${encodeURIComponent(competencyId)}`)"
            />
          </div>
          <q-card class="dvmr-card q-pa-md">
            <div class="note-preview text-body2">{{ notePreview }}</div>
          </q-card>
          <div v-if="clozeCount > 0" class="row items-center q-mt-md">
            <div class="col text-caption text-grey-6">
              {{ clozeCount }} cloze card{{ clozeCount !== 1 ? 's' : '' }}
            </div>
            <q-btn
              flat
              no-caps
              color="primary"
              label="Drill Cards"
              size="sm"
              @click="router.push(`/cloze/${encodeURIComponent(competencyId)}`)"
            />
          </div>
        </template>
      </q-tab-panel>

      <!-- ── Resources ─────────────────────────────────────────── -->
      <q-tab-panel name="resources" class="q-pa-md">
        <div class="row items-center q-mb-sm">
          <div class="col text-caption text-grey-6">
            External links — link out only, not an endorsement
          </div>
          <q-btn flat round dense icon="add" color="primary" @click="showAddDialog = true" />
        </div>

        <!-- Seed/candidate links for this competency subject -->
        <template v-if="seedResources.length > 0 && resources.length === 0">
          <div class="text-caption text-grey-5 q-mb-sm">Suggested starting points (not saved):</div>
          <q-card class="dvmr-card q-mb-md">
            <q-list dense separator>
              <q-item
                v-for="s in seedResources"
                :key="s.url"
                clickable
                tag="a"
                :href="s.url"
                target="_blank"
                rel="noopener noreferrer"
              >
                <q-item-section avatar>
                  <q-icon :name="typeIcon(s.type)" color="primary" size="sm" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-body2">{{ s.sourceName }}</q-item-label>
                  <q-item-label caption class="text-grey-6">{{ s.licenseNote }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-icon name="open_in_new" color="grey-4" size="xs" />
                </q-item-section>
              </q-item>
            </q-list>
          </q-card>
        </template>

        <div
          v-if="resources.length === 0 && seedResources.length === 0"
          class="text-center text-grey-5 q-pa-xl"
        >
          <q-icon name="link" size="3rem" color="grey-3" />
          <div class="q-mt-sm">No resources saved yet.</div>
        </div>

        <q-card v-if="resources.length > 0" class="dvmr-card q-mb-md">
          <q-list dense separator>
            <q-item
              v-for="r in resources"
              :key="r.id ?? 0"
              clickable
              tag="a"
              :href="r.url"
              target="_blank"
              rel="noopener noreferrer"
            >
              <q-item-section avatar>
                <q-icon :name="typeIcon(r.type)" color="primary" size="sm" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-body2">{{ r.sourceName }}</q-item-label>
                <q-item-label caption class="text-grey-6">{{ r.licenseNote }}</q-item-label>
                <q-item-label v-if="r.verifiedBy" caption class="text-positive">
                  <q-icon name="verified" size="xs" /> {{ r.verifiedBy }}
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-btn
                  flat
                  round
                  dense
                  icon="delete_outline"
                  color="grey-4"
                  size="sm"
                  @click.prevent="removeResource(r.id!)"
                />
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </q-tab-panel>
    </q-tab-panels>

    <!-- Add resource dialog -->
    <q-dialog v-model="showAddDialog" persistent>
      <q-card style="min-width: 320px; max-width: 480px; width: 100%">
        <q-card-section>
          <div class="text-h6">Add Resource</div>
          <div class="text-caption text-grey-6">
            Link out only — do not embed or copy third-party content.
          </div>
        </q-card-section>
        <q-card-section class="q-pt-none column q-gutter-sm">
          <q-input v-model="newRes.url" label="URL *" dense outlined />
          <q-input v-model="newRes.sourceName" label="Source name *" dense outlined />
          <q-input
            v-model="newRes.licenseNote"
            label="License note"
            dense
            outlined
            placeholder="e.g. Free to access, CC BY-SA"
          />
          <q-select
            v-model="newRes.type"
            :options="RESOURCE_TYPES"
            label="Type"
            dense
            outlined
            emit-value
            map-options
          />
          <q-input v-model="newRes.verifiedBy" label="Verified by (optional)" dense outlined />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat no-caps label="Cancel" @click="closeAddDialog" />
          <q-btn
            unelevated
            no-caps
            color="primary"
            label="Save"
            :disable="!newRes.url || !newRes.sourceName"
            @click="saveResource"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useResourceStore } from '@/stores/resourceStore';
import { useCompetencyNotesStore } from '@/stores/competencyNotesStore';
import { useMistakeJournalStore } from '@/stores/mistakeJournalStore';
import { useQuizStore } from '@/stores/quizStore';
import { loadAllQuestions } from '@/data/loaders/questions';
import { loadTos, getCompetencyById } from '@/data/loaders/tos';
import type { ResourceType } from '@/types/resource';
import type { Question } from '@/types/question';

const RESOURCE_TYPES = [
  { label: 'Atlas', value: 'atlas' },
  { label: 'Reference', value: 'reference' },
  { label: 'Video', value: 'video' },
  { label: 'Course', value: 'course' },
  { label: 'Article', value: 'article' },
];

// Candidate link-outs per subject (seed data, not persisted)
const SEED_RESOURCES: Record<
  string,
  { url: string; sourceName: string; licenseNote: string; type: ResourceType }[]
> = {
  'Veterinary Anatomy': [
    {
      url: 'https://www.imaios.com/en/e-anatomy/animals',
      sourceName: 'IMAIOS e-Anatomy (Animals)',
      licenseNote: 'Paid; free preview available',
      type: 'atlas',
    },
    {
      url: 'https://en.wikivet.net/Anatomy',
      sourceName: 'WikiVet — Anatomy',
      licenseNote: 'CC BY-SA',
      type: 'reference',
    },
  ],
  'Veterinary Physiology': [
    {
      url: 'https://en.wikivet.net/Physiology',
      sourceName: 'WikiVet — Physiology',
      licenseNote: 'CC BY-SA',
      type: 'reference',
    },
    {
      url: 'https://www.merckvetmanual.com',
      sourceName: 'Merck Veterinary Manual',
      licenseNote: 'Free to access',
      type: 'reference',
    },
  ],
  Zootechnics: [
    {
      url: 'https://www.merckvetmanual.com/management-and-nutrition',
      sourceName: 'Merck VM — Management & Nutrition',
      licenseNote: 'Free to access',
      type: 'reference',
    },
    {
      url: 'https://en.wikivet.net/Zoology',
      sourceName: 'WikiVet — Animal Production',
      licenseNote: 'CC BY-SA',
      type: 'reference',
    },
  ],
  'Veterinary Pathology': [
    {
      url: 'https://en.wikivet.net/Pathology',
      sourceName: 'WikiVet — Pathology',
      licenseNote: 'CC BY-SA',
      type: 'reference',
    },
    {
      url: 'https://www.merckvetmanual.com/special-subjects/the-merck-veterinary-manual',
      sourceName: 'Merck Veterinary Manual',
      licenseNote: 'Free to access',
      type: 'reference',
    },
  ],
  'Veterinary Pharmacology': [
    {
      url: 'https://www.plumbsveterinarydrugs.com',
      sourceName: "Plumb's Veterinary Drugs",
      licenseNote: 'Subscription; limited free search',
      type: 'reference',
    },
    {
      url: 'https://en.wikivet.net/Pharmacology',
      sourceName: 'WikiVet — Pharmacology',
      licenseNote: 'CC BY-SA',
      type: 'reference',
    },
  ],
  'Veterinary Medicine': [
    {
      url: 'https://www.merckvetmanual.com',
      sourceName: 'Merck Veterinary Manual',
      licenseNote: 'Free to access',
      type: 'reference',
    },
    {
      url: 'https://en.wikivet.net/Medicine',
      sourceName: 'WikiVet — Medicine',
      licenseNote: 'CC BY-SA',
      type: 'reference',
    },
  ],
  'Veterinary Microbiology and Public Health': [
    {
      url: 'https://en.wikivet.net/Microbiology',
      sourceName: 'WikiVet — Microbiology',
      licenseNote: 'CC BY-SA',
      type: 'reference',
    },
    {
      url: 'https://www.merckvetmanual.com/infectious-diseases',
      sourceName: 'Merck VM — Infectious Diseases',
      licenseNote: 'Free to access',
      type: 'reference',
    },
  ],
  'Veterinary Parasitology': [
    {
      url: 'https://en.wikivet.net/Parasitology',
      sourceName: 'WikiVet — Parasitology',
      licenseNote: 'CC BY-SA',
      type: 'reference',
    },
    {
      url: 'https://www.merckvetmanual.com/dog-owners/parasitic-diseases-of-dogs',
      sourceName: 'Merck VM — Parasitology',
      licenseNote: 'Free to access',
      type: 'reference',
    },
  ],
  'Veterinary Surgery': [
    {
      url: 'https://en.wikivet.net/Surgery',
      sourceName: 'WikiVet — Surgery',
      licenseNote: 'CC BY-SA',
      type: 'reference',
    },
    {
      url: 'https://www.merckvetmanual.com/special-subjects/pain-management-in-veterinary-patients',
      sourceName: 'Merck VM — Surgery / Anesthesia',
      licenseNote: 'Free to access',
      type: 'reference',
    },
  ],
};

const router = useRouter();
const route = useRoute();

const resourceStore = useResourceStore();
const notesStore = useCompetencyNotesStore();
const mistakeStore = useMistakeJournalStore();
const quizStore = useQuizStore();

const competencyId = computed(() => (route.params as { competencyId: string }).competencyId);

const allQuestions = ref<Question[]>([]);
const resolved = computed(() => {
  const tos = loadTos();
  return getCompetencyById(tos, competencyId.value);
});

const competencyQuestions = computed(() =>
  allQuestions.value.filter((q) =>
    (q.competencyIds ?? [q.competencyId]).includes(competencyId.value),
  ),
);

const questionCount = computed(() => competencyQuestions.value.length);

const hasNote = computed(() => !!notesStore.getNote(competencyId.value));
const clozeCount = computed(() => notesStore.getClozeCards(competencyId.value).length);
const blurtCount = computed(() => notesStore.getBlurtSessions(competencyId.value).length);

const notePreview = computed(() => {
  const note = notesStore.getNote(competencyId.value);
  if (!note) return '';
  return note.bodyMd.slice(0, 300) + (note.bodyMd.length > 300 ? '…' : '');
});

const noteAge = computed(() => {
  const note = notesStore.getNote(competencyId.value);
  if (!note || note.updatedAt === 0) return '';
  const diff = Date.now() - note.updatedAt;
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
});

const mistakeEntries = computed(() =>
  mistakeStore.entries.filter((e) => competencyQuestions.value.some((q) => q.id === e.questionId)),
);
const mistakeCount = computed(() => mistakeEntries.value.length);
const mistakeReasons = computed(() => {
  const counts: Record<string, number> = {};
  for (const e of mistakeEntries.value) {
    counts[e.reason] = (counts[e.reason] ?? 0) + 1;
  }
  return counts;
});

const resources = computed(() => resourceStore.getResources(competencyId.value));
const seedResources = computed(() => {
  if (!resolved.value) return [];
  return SEED_RESOURCES[resolved.value.subject] ?? [];
});

// Add dialog
const showAddDialog = ref(false);
const newRes = ref<{
  url: string;
  sourceName: string;
  licenseNote: string;
  type: ResourceType;
  verifiedBy: string;
}>({ url: '', sourceName: '', licenseNote: 'Free to access', type: 'reference', verifiedBy: '' });

function closeAddDialog() {
  showAddDialog.value = false;
  newRes.value = {
    url: '',
    sourceName: '',
    licenseNote: 'Free to access',
    type: 'reference',
    verifiedBy: '',
  };
}

async function saveResource() {
  const { url, sourceName, licenseNote, type, verifiedBy } = newRes.value;
  if (!url || !sourceName) return;
  await resourceStore.addResource(
    competencyId.value,
    url,
    sourceName,
    licenseNote,
    type,
    verifiedBy || undefined,
  );
  closeAddDialog();
}

async function removeResource(id: number) {
  await resourceStore.deleteResource(competencyId.value, id);
}

function startQuiz() {
  if (competencyQuestions.value.length === 0) return;
  const label = resolved.value?.text ?? competencyId.value;
  quizStore.startQuiz(competencyQuestions.value, { type: 'competency', label });
  void router.push('/quiz');
}

function typeIcon(type: ResourceType): string {
  const icons: Record<ResourceType, string> = {
    atlas: 'map',
    reference: 'menu_book',
    video: 'play_circle',
    course: 'school',
    article: 'article',
  };
  return icons[type];
}

const activeTab = ref('overview');

onMounted(async () => {
  const [questions] = await Promise.all([
    loadAllQuestions(),
    notesStore.loadNote(competencyId.value),
    mistakeStore.load(),
    resourceStore.loadForCompetency(competencyId.value),
  ]);
  allQuestions.value = questions;
});
</script>

<style scoped>
.stat-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

@media (min-width: 480px) {
  .stat-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.stat-chip {
  background: #f8fafc;
  border: 1px solid var(--dvmr-border);
  border-radius: var(--dvmr-radius-sm);
  padding: 10px;
  text-align: center;
}

.note-preview {
  font-family: 'SF Mono', ui-monospace, monospace;
  font-size: 0.8rem;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 200px;
  overflow: hidden;
}

.ellipsis-2-lines {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
