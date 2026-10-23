<template>
  <q-page class="column" style="max-width: 720px; margin: 0 auto">

    <!-- Header -->
    <div class="row items-center q-px-md q-pt-md q-pb-sm">
      <q-btn flat round dense icon="arrow_back" color="grey-7" @click="router.back()" />
      <div class="col q-ml-sm">
        <div class="text-caption text-grey-6 ellipsis" style="max-width: 280px">{{ competencyId }}</div>
        <div v-if="resolvedTitle" class="text-body2 text-weight-medium ellipsis">{{ resolvedTitle }}</div>
      </div>
      <q-btn
        v-if="isDirty"
        flat dense no-caps color="primary" label="Save"
        @click="save"
      />
      <q-btn flat dense round icon="more_vert" color="grey-6">
        <q-menu>
          <q-list dense>
            <q-item clickable v-close-popup @click="copyMarkdown">
              <q-item-section>Copy as Markdown</q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="goBlurt" :disable="!notesStore.getNote(competencyId)">
              <q-item-section>Blurt Mode</q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="confirmDelete" :disable="!notesStore.getNote(competencyId)">
              <q-item-section class="text-negative">Delete Note</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-btn>
    </div>

    <q-separator />

    <!-- Tab bar: Edit / Review Sheet -->
    <q-tabs
      v-model="activeTab"
      dense
      align="left"
      active-color="primary"
      indicator-color="primary"
      class="q-px-md"
    >
      <q-tab name="edit" label="Notes" no-caps />
      <q-tab name="sheet" label="Review Sheet" no-caps />
      <q-tab name="cards" :label="`Cards (${clozeCards.length})`" no-caps />
    </q-tabs>

    <q-tab-panels v-model="activeTab" animated class="col">

      <!-- ── Edit tab ──────────────────────────────────────────── -->
      <q-tab-panel name="edit" class="q-pa-none">
        <!-- Syntax hint -->
        <div class="syntax-hint row items-center q-px-md q-py-xs">
          <span class="text-caption text-grey-5">
            ==highlight== → cloze card &nbsp;·&nbsp; [[competencyId]] → wiki link
          </span>
        </div>
        <q-input
          v-model="draftBody"
          type="textarea"
          autogrow
          filled
          square
          borderless
          class="note-editor col"
          input-class="note-textarea"
          placeholder="Start typing your notes…"
          @update:model-value="isDirty = true"
        />
      </q-tab-panel>

      <!-- ── Review Sheet tab ──────────────────────────────────── -->
      <q-tab-panel name="sheet" class="q-pa-md">
        <div v-if="!sheet" class="text-center text-grey-5 q-pa-xl">
          <q-icon name="description" size="3rem" color="grey-3" />
          <div class="q-mt-sm">Save your notes to see the review sheet.</div>
        </div>
        <template v-else>
          <!-- Stats row -->
          <div class="row q-gutter-sm q-mb-md">
            <div class="stat-chip">
              <div class="text-caption text-grey-5">Blurt avg</div>
              <div class="text-body2 text-weight-bold">
                {{ sheet.stats.avgBlurtScore !== null ? sheet.stats.avgBlurtScore.toFixed(1) + '/3' : '—' }}
              </div>
            </div>
            <div class="stat-chip">
              <div class="text-caption text-grey-5">Mistakes</div>
              <div class="text-body2 text-weight-bold">{{ sheet.stats.mistakeCount }}</div>
            </div>
            <div class="stat-chip">
              <div class="text-caption text-grey-5">Cards</div>
              <div class="text-body2 text-weight-bold">{{ sheet.stats.clozeCount }}</div>
            </div>
          </div>

          <!-- Mistake breakdown -->
          <template v-if="sheet.stats.mistakeCount > 0">
            <div class="text-subtitle2 text-grey-7 q-mb-xs">Mistake Reasons</div>
            <q-card class="dvmr-card q-mb-md">
              <q-list dense>
                <q-item v-for="(count, reason) in sheet.stats.mistakeReasons" :key="reason">
                  <q-item-section>
                    <span class="text-body2">{{ reason }}</span>
                  </q-item-section>
                  <q-item-section side>
                    <q-badge color="negative" :label="count" />
                  </q-item-section>
                </q-item>
              </q-list>
            </q-card>
          </template>

          <!-- Wiki links -->
          <template v-if="sheet.wikiLinks.length > 0">
            <div class="text-subtitle2 text-grey-7 q-mb-xs">Linked Competencies</div>
            <q-card class="dvmr-card q-mb-md">
              <q-list dense separator>
                <q-item
                  v-for="link in sheet.wikiLinks"
                  :key="link.competencyId"
                  clickable
                  @click="goToNote(link.competencyId)"
                >
                  <q-item-section>
                    <q-item-label class="text-body2">{{ link.displayText }}</q-item-label>
                    <q-item-label caption class="text-grey-6">{{ link.resolved?.text ?? 'Unknown competency' }}</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-icon name="chevron_right" color="grey-4" />
                  </q-item-section>
                </q-item>
              </q-list>
            </q-card>
          </template>

          <!-- Export -->
          <q-btn
            flat no-caps color="primary" icon="content_copy" label="Copy as Markdown"
            size="sm" @click="copyMarkdown"
          />
        </template>
      </q-tab-panel>

      <!-- ── Cards tab ──────────────────────────────────────────── -->
      <q-tab-panel name="cards" class="q-pa-md">
        <div v-if="clozeCards.length === 0" class="text-center text-grey-5 q-pa-xl">
          <q-icon name="flash_on" size="3rem" color="grey-3" />
          <div class="q-mt-sm">No cloze cards yet.</div>
          <div class="text-caption q-mt-xs">Use ==highlight== syntax in your notes to auto-generate cards.</div>
        </div>
        <template v-else>
          <div class="text-caption text-grey-6 q-mb-sm">{{ clozeCards.length }} card{{ clozeCards.length !== 1 ? 's' : '' }}</div>
          <q-card
            v-for="card in clozeCards"
            :key="card.id"
            class="dvmr-card q-mb-sm"
          >
            <q-card-section class="q-py-sm">
              <div class="row items-start">
                <div class="col">
                  <div class="text-body2 text-weight-medium q-mb-xs">{{ card.front }}</div>
                  <div class="text-caption text-grey-6">{{ card.back }}</div>
                </div>
                <q-btn
                  flat round dense icon="delete_outline" color="grey-4" size="sm"
                  @click="deleteCard(card.id!)"
                />
              </div>
              <q-badge v-if="card.source === 'manual'" color="primary" label="manual" size="xs" class="q-mt-xs" />
            </q-card-section>
          </q-card>
        </template>
      </q-tab-panel>
    </q-tab-panels>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import { useCompetencyNotesStore } from '@/stores/competencyNotesStore';
import { useMistakeJournalStore } from '@/stores/mistakeJournalStore';
import { resolveWikiLink } from '@/services/wikiLinks';
import { exportReviewSheetAsMarkdown } from '@/services/reviewSheet';

const router = useRouter();
const route = useRoute();
const $q = useQuasar();

const notesStore = useCompetencyNotesStore();
const mistakeStore = useMistakeJournalStore();

const competencyId = computed(() => String(route.params.competencyId));

const draftBody = ref('');
const isDirty = ref(false);
const activeTab = ref<'edit' | 'sheet' | 'cards'>('edit');

const resolvedTitle = computed(() => {
  const r = resolveWikiLink(competencyId.value);
  return r?.text ?? null;
});

const clozeCards = computed(() => notesStore.getClozeCards(competencyId.value));

const sheet = computed(() => {
  const mistakes = mistakeStore.entries.filter((e) => {
    const note = notesStore.getNote(competencyId.value);
    return !!note;
  });
  return notesStore.getReviewSheet(competencyId.value, mistakeStore.entries);
});

onMounted(async () => {
  await Promise.all([
    notesStore.loadNote(competencyId.value),
    mistakeStore.load(),
  ]);
  const existing = notesStore.getNote(competencyId.value);
  draftBody.value = existing?.bodyMd ?? '';
});

watch(competencyId, async (id) => {
  await notesStore.loadNote(id);
  const existing = notesStore.getNote(id);
  draftBody.value = existing?.bodyMd ?? '';
  isDirty.value = false;
});

async function save() {
  await notesStore.saveNote(competencyId.value, draftBody.value);
  isDirty.value = false;
  $q.notify({ type: 'positive', message: 'Note saved', timeout: 1500, position: 'top' });
}

async function deleteCard(id: number) {
  await notesStore.deleteClozeCard(competencyId.value, id);
}

function copyMarkdown() {
  const s = sheet.value;
  const text = s ? exportReviewSheetAsMarkdown(s) : draftBody.value;
  void navigator.clipboard.writeText(text);
  $q.notify({ type: 'positive', message: 'Copied to clipboard', timeout: 1500, position: 'top' });
}

function goBlurt() {
  void router.push(`/blurt/${encodeURIComponent(competencyId.value)}`);
}

function goToNote(id: string) {
  void router.push(`/notes/${encodeURIComponent(id)}`);
}

function confirmDelete() {
  $q.dialog({
    title: 'Delete note?',
    message: 'This will also remove all auto-generated cloze cards for this competency.',
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    await notesStore.deleteNote(competencyId.value);
    router.back();
  });
}
</script>

<style scoped>
.syntax-hint {
  background: #f8fafc;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.note-editor {
  height: 100%;
}

:deep(.note-textarea) {
  font-family: 'SF Mono', ui-monospace, 'Cascadia Code', monospace;
  font-size: 0.875rem;
  line-height: 1.7;
  padding: 16px;
  min-height: 60vh;
  resize: none;
}

.stat-chip {
  flex: 1;
  background: #f8fafc;
  border: 1px solid var(--dvmr-border);
  border-radius: var(--dvmr-radius-sm);
  padding: 8px 10px;
  text-align: center;
  min-width: 0;
}
</style>
