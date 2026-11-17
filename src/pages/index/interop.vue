<template>
  <q-page class="column" style="max-width: 720px; margin: 0 auto">

    <div class="q-px-md q-pt-md q-pb-sm">
      <div class="text-h6">Export &amp; Interop</div>
      <div class="text-caption text-grey-6 q-mt-xs">
        Share questions with Anki, export your notes as Markdown, and manage content packs.
      </div>
    </div>

    <q-tabs
      v-model="activeTab"
      dense
      align="justify"
      active-color="primary"
      indicator-color="primary"
      class="q-px-md"
      style="border-bottom: 1px solid var(--dvmr-border)"
    >
      <q-tab name="anki-export"  label="Anki Export"  no-caps />
      <q-tab name="anki-import"  label="Anki Import"  no-caps />
      <q-tab name="notes"        label="Notes"         no-caps />
      <q-tab name="packs"        label="Content Packs" no-caps />
    </q-tabs>

    <q-tab-panels v-model="activeTab" animated class="col">

      <!-- ── Anki Export ──────────────────────────────────────── -->
      <q-tab-panel name="anki-export" class="q-pa-md">
        <div class="text-caption text-grey-6 q-mb-md">
          Export questions as a tab-separated file importable into Anki. Covers all questions in
          the app (seed + imported).
        </div>

        <q-card class="dvmr-card q-mb-md">
          <q-card-section>
            <div class="text-body2 text-weight-medium q-mb-sm">Filter by subject</div>
            <q-select
              v-model="exportSubject"
              :options="subjectOptions"
              label="Subject"
              dense
              outlined
              emit-value
              map-options
              clearable
              hint="Leave blank to export all subjects"
              class="q-mb-sm"
            />
            <div class="text-caption text-grey-6">
              {{ exportCount }} question{{ exportCount !== 1 ? 's' : '' }} will be exported
            </div>
          </q-card-section>
          <q-separator />
          <q-card-actions>
            <q-btn
              unelevated no-caps color="primary"
              icon="download"
              label="Download Anki TSV"
              :disable="exportCount === 0"
              @click="doAnkiExport"
            />
          </q-card-actions>
        </q-card>

        <q-banner rounded dense class="text-caption bg-blue-1 text-blue-9">
          <template #avatar><q-icon name="info" color="blue-7" size="xs" /></template>
          In Anki: File → Import → select the .txt file → set separator to Tab → import.
        </q-banner>
      </q-tab-panel>

      <!-- ── Anki Import ──────────────────────────────────────── -->
      <q-tab-panel name="anki-import" class="q-pa-md">
        <div class="text-caption text-grey-6 q-mb-md">
          Upload an Anki plain-text export (tab-separated). Parses cards into question stubs
          ready for the Import Questions page.
        </div>

        <q-card class="dvmr-card q-mb-md">
          <q-card-section>
            <q-btn
              unelevated no-caps color="primary"
              icon="upload_file"
              label="Choose Anki .txt file"
              @click="ankiFileInput?.click()"
            />
            <input
              ref="ankiFileInput"
              type="file"
              accept=".txt,.csv,.tsv"
              style="display: none"
              @change="onAnkiFile"
            />
          </q-card-section>

          <template v-if="ankiParseResult">
            <q-separator />
            <q-card-section class="q-pb-xs">
              <div class="row items-center q-gutter-xs q-mb-sm">
                <q-icon name="check_circle" color="positive" size="sm" />
                <span class="text-body2 text-positive">{{ ankiParseResult.rows.length }} card{{ ankiParseResult.rows.length !== 1 ? 's' : '' }} parsed</span>
                <span v-if="ankiParseResult.skipped > 0" class="text-caption text-grey-6">
                  ({{ ankiParseResult.skipped }} skipped)
                </span>
              </div>
              <div class="text-caption text-grey-6 q-mb-sm">
                JSON output is shown below. Copy it, then paste into the
                <router-link to="/import" class="text-primary">Import Questions</router-link> page.
              </div>
            </q-card-section>
            <q-card-section class="q-pt-xs">
              <q-input
                v-model="ankiParsedJson"
                type="textarea"
                outlined
                dense
                rows="8"
                readonly
                style="font-family: monospace; font-size: 11px"
              />
              <q-btn
                flat no-caps dense
                icon="content_copy"
                label="Copy JSON"
                class="q-mt-xs"
                @click="copyAnkiJson"
              />
            </q-card-section>
          </template>

          <template v-if="ankiParseResult?.errors?.length">
            <q-separator />
            <q-card-section>
              <div class="text-caption text-negative" v-for="e in ankiParseResult.errors" :key="e">{{ e }}</div>
            </q-card-section>
          </template>
        </q-card>

        <q-banner rounded dense class="text-caption bg-amber-1 text-amber-9">
          <template #avatar><q-icon name="warning" color="amber-7" size="xs" /></template>
          Imported cards are always <strong>unverified</strong>. Review and correct fields in the
          Import Questions page before use.
        </q-banner>
      </q-tab-panel>

      <!-- ── Notes Markdown Export ───────────────────────────── -->
      <q-tab-panel name="notes" class="q-pa-md">
        <div class="text-caption text-grey-6 q-mb-md">
          Export all your competency notes as a single Markdown file — useful for offline review
          or sharing with study partners.
        </div>

        <q-card class="dvmr-card q-mb-md">
          <q-card-section>
            <div class="row items-center q-gutter-sm q-mb-sm">
              <q-icon name="edit_note" color="primary" />
              <span class="text-body2 text-weight-medium">Competency Notes</span>
              <q-badge color="primary" :label="notesCount" />
            </div>
            <div class="text-caption text-grey-6">
              {{ notesCount === 0
                ? 'No notes yet. Write notes from the Browse → hub page for any competency.'
                : `${notesCount} note${notesCount !== 1 ? 's' : ''} across all subjects.` }}
            </div>
          </q-card-section>
          <q-separator />
          <q-card-actions>
            <q-btn
              unelevated no-caps
              color="primary"
              icon="download"
              label="Download as Markdown (.md)"
              :disable="notesCount === 0"
              @click="doNotesExport"
            />
          </q-card-actions>
        </q-card>

        <q-banner rounded dense class="text-caption bg-blue-1 text-blue-9">
          <template #avatar><q-icon name="info" color="blue-7" size="xs" /></template>
          The Markdown file uses standard headings and can be opened in Obsidian, Typora,
          VS Code, or any Markdown viewer.
        </q-banner>
      </q-tab-panel>

      <!-- ── Content Packs ────────────────────────────────────── -->
      <q-tab-panel name="packs" class="q-pa-md">
        <div class="text-caption text-grey-6 q-mb-md">
          Bundle your imported questions into a shareable JSON file, or install a content pack
          from a file.
        </div>

        <!-- Export pack -->
        <div class="text-subtitle2 text-grey-7 q-mb-xs">Export Questions as Pack</div>
        <q-card class="dvmr-card q-mb-md">
          <q-card-section>
            <q-input
              v-model="packName"
              label="Pack name"
              outlined dense
              class="q-mb-sm"
              hint="e.g. 'My Pharmacology Set'"
            />
            <q-input
              v-model="packAuthor"
              label="Author (optional)"
              outlined dense
              class="q-mb-sm"
            />
            <q-select
              v-model="packSubject"
              :options="subjectOptions"
              label="Subject filter"
              outlined dense
              clearable
              emit-value map-options
              hint="Leave blank to export all imported questions"
              class="q-mb-sm"
            />
            <div class="text-caption text-grey-6">
              {{ packQuestionCount }} question{{ packQuestionCount !== 1 ? 's' : '' }} will be included
            </div>
          </q-card-section>
          <q-separator />
          <q-card-actions>
            <q-btn
              unelevated no-caps color="primary"
              icon="ios_share"
              label="Export Pack"
              :disable="!packName.trim() || packQuestionCount === 0 || packExporting"
              :loading="packExporting"
              @click="doPackExport"
            />
          </q-card-actions>
        </q-card>

        <!-- Installed packs -->
        <div class="text-subtitle2 text-grey-7 q-mb-xs">Installed Packs</div>
        <q-card class="dvmr-card q-mb-md">
          <q-list dense separator v-if="installedPacks.length > 0">
            <q-item v-for="p in installedPacks" :key="p.packId">
              <q-item-section avatar>
                <q-icon name="inventory_2" color="primary" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-body2 text-weight-medium">{{ p.name }}</q-item-label>
                <q-item-label caption class="text-grey-6">
                  v{{ p.version }} · {{ p.questionCount }} questions
                  {{ p.author ? `· ${p.author}` : '' }}
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-btn
                  flat dense round icon="delete" color="negative" size="sm"
                  @click="confirmRemovePack(p.packId)"
                />
              </q-item-section>
            </q-item>
          </q-list>
          <q-card-section v-else class="text-caption text-grey-5">
            No content packs installed.
          </q-card-section>
        </q-card>

        <!-- Import pack -->
        <div class="text-subtitle2 text-grey-7 q-mb-xs">Import Pack from File</div>
        <q-card class="dvmr-card q-mb-md">
          <q-card-section>
            <q-btn
              unelevated no-caps color="primary"
              icon="upload_file"
              label="Choose pack .json file"
              @click="packFileInput?.click()"
            />
            <input
              ref="packFileInput"
              type="file"
              accept=".json,application/json"
              style="display: none"
              @change="onPackFile"
            />
          </q-card-section>
          <template v-if="packPreview">
            <q-separator />
            <q-card-section>
              <div class="text-body2 text-weight-medium q-mb-xs">{{ packPreview.manifest.name }}</div>
              <div class="text-caption text-grey-6">
                v{{ packPreview.manifest.version }}
                · {{ packPreview.questions.length }} questions
                {{ packPreview.manifest.author ? `· by ${packPreview.manifest.author}` : '' }}
              </div>
              <div v-if="packPreview.manifest.description" class="text-caption text-grey-7 q-mt-xs">
                {{ packPreview.manifest.description }}
              </div>
            </q-card-section>
            <q-separator />
            <q-card-actions>
              <q-btn
                unelevated no-caps color="positive"
                icon="download_done"
                label="Install Pack"
                :loading="packInstalling"
                @click="doPackInstall"
              />
              <q-btn flat no-caps color="grey-7" label="Cancel" @click="packPreview = null" />
            </q-card-actions>
          </template>
        </q-card>

        <!-- Status banner -->
        <q-banner
          v-if="packStatus"
          rounded dense
          :class="packStatusError ? 'bg-negative text-white' : 'bg-positive text-white'"
          class="q-mb-md"
        >
          <template #avatar>
            <q-icon :name="packStatusError ? 'error' : 'check_circle'" color="white" />
          </template>
          {{ packStatus }}
          <template #action>
            <q-btn flat color="white" icon="close" dense round @click="packStatus = ''" />
          </template>
        </q-banner>
      </q-tab-panel>

    </q-tab-panels>

    <!-- Remove pack confirm dialog -->
    <q-dialog v-model="showRemoveDialog" persistent>
      <q-card style="min-width: 280px; max-width: 400px">
        <q-card-section>
          <div class="text-body1 text-weight-medium text-negative q-mb-sm">Remove Content Pack?</div>
          <div class="text-body2">
            This deletes all questions from pack <strong>{{ packToRemove }}</strong> that have
            not been edited by you. User-modified questions are kept.
          </div>
        </q-card-section>
        <q-card-actions align="right" class="q-pb-md q-pr-md">
          <q-btn flat no-caps label="Cancel" v-close-popup />
          <q-btn unelevated no-caps color="negative" label="Remove Pack" @click="doRemovePack" />
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useQuestionStore } from '@/stores/questionStore';
import { localRepository } from '@/db/repository';
import { VMLE_SUBJECTS, type VmleSubject, type Question } from '@/types/question';
import type { InstalledPack } from '@/types/contentPack';
import type { ContentPackBundle } from '@/services/contentPackIO';
import { downloadAnkiTsv } from '@/services/ankiExport';
import { parseAnkiTsv, ankiRowsToQuestions } from '@/services/ankiImport';
import { downloadNotesMarkdown } from '@/services/notesExport';
import { buildBundle, downloadBundle, parseBundle } from '@/services/contentPackIO';

const $q = useQuasar();
const questionStore = useQuestionStore();

const activeTab = ref('anki-export');
const ankiFileInput = ref<HTMLInputElement | null>(null);
const packFileInput = ref<HTMLInputElement | null>(null);

// ── Shared ───────────────────────────────────────────────────────────────────

const subjectOptions = VMLE_SUBJECTS.map((s) => ({ label: s, value: s }));

// ── Anki Export ───────────────────────────────────────────────────────────────

const exportSubject = ref<VmleSubject | null>(null);

const allQuestions = computed(() => questionStore.questions);

const exportQuestions = computed(() =>
  exportSubject.value
    ? allQuestions.value.filter((q) => q.vmleSubject === exportSubject.value)
    : allQuestions.value,
);
const exportCount = computed(() => exportQuestions.value.length);

function doAnkiExport() {
  downloadAnkiTsv(exportQuestions.value);
  $q.notify({ type: 'positive', message: `Downloaded ${exportCount.value} questions as Anki TSV.`, timeout: 2000 });
}

// ── Anki Import ───────────────────────────────────────────────────────────────

const ankiParseResult = ref<{ rows: ReturnType<typeof parseAnkiTsv>['rows']; skipped: number; errors: string[] } | null>(null);
const ankiParsedJson = ref('');

async function onAnkiFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const text = await file.text();
  const result = parseAnkiTsv(text);
  ankiParseResult.value = result;
  if (result.rows.length > 0) {
    const questions = ankiRowsToQuestions(result.rows);
    ankiParsedJson.value = JSON.stringify(questions, null, 2);
  } else {
    ankiParsedJson.value = '';
  }
  if (ankiFileInput.value) ankiFileInput.value.value = '';
}

async function copyAnkiJson() {
  await navigator.clipboard.writeText(ankiParsedJson.value);
  $q.notify({ type: 'positive', message: 'Copied to clipboard!', timeout: 1500 });
}

// ── Notes Export ──────────────────────────────────────────────────────────────

const notesCount = ref(0);

async function loadNotesCount() {
  const notes = await localRepository.getAllCompetencyNotes();
  notesCount.value = notes.length;
}

async function doNotesExport() {
  const notes = await localRepository.getAllCompetencyNotes();
  downloadNotesMarkdown(notes);
  $q.notify({ type: 'positive', message: `Downloaded ${notes.length} notes as Markdown.`, timeout: 2000 });
}

// ── Content Packs ─────────────────────────────────────────────────────────────

const packName = ref('');
const packAuthor = ref('');
const packSubject = ref<VmleSubject | null>(null);
const packExporting = ref(false);
const packStatus = ref('');
const packStatusError = ref(false);
const installedPacks = ref<InstalledPack[]>([]);
const packPreview = ref<ContentPackBundle | null>(null);
const packInstalling = ref(false);
const showRemoveDialog = ref(false);
const packToRemove = ref('');

const importedQuestions = computed(() =>
  allQuestions.value.filter((q: Question) => q.sourceType === 'imported' || q.sourceType === 'ai-draft'),
);

const packQuestionCount = computed(() => {
  const qs = packSubject.value
    ? importedQuestions.value.filter((q) => q.vmleSubject === packSubject.value)
    : importedQuestions.value;
  return qs.length;
});

async function doPackExport() {
  packExporting.value = true;
  try {
    const qs = packSubject.value
      ? importedQuestions.value.filter((q) => q.vmleSubject === packSubject.value)
      : importedQuestions.value;
    const packId = packName.value.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const authorVal = packAuthor.value.trim();
    const bundle = await buildBundle({
      packId,
      name: packName.value.trim(),
      ...(authorVal ? { author: authorVal } : {}),
      questions: qs,
    });
    downloadBundle(bundle);
    $q.notify({ type: 'positive', message: `Exported ${qs.length} questions as content pack.`, timeout: 2000 });
  } finally {
    packExporting.value = false;
  }
}

async function onPackFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const text = await file.text();
  const { bundle, errors } = parseBundle(text);
  if (errors.length > 0 || !bundle) {
    packStatus.value = `Parse error: ${errors.map((e) => e.message).join('; ')}`;
    packStatusError.value = true;
  } else {
    packPreview.value = bundle;
  }
  if (packFileInput.value) packFileInput.value.value = '';
}

async function doPackInstall() {
  if (!packPreview.value) return;
  packInstalling.value = true;
  try {
    const { manifest, questions } = packPreview.value;
    const result = await localRepository.installContentPack(manifest, questions);
    await questionStore.reload();
    await loadInstalledPacks();
    packPreview.value = null;
    packStatus.value = `Pack installed: ${result.added} added, ${result.skipped} skipped.`;
    packStatusError.value = false;
  } catch (err) {
    packStatus.value = `Install failed: ${err instanceof Error ? err.message : String(err)}`;
    packStatusError.value = true;
  } finally {
    packInstalling.value = false;
  }
}

function confirmRemovePack(packId: string) {
  packToRemove.value = packId;
  showRemoveDialog.value = true;
}

async function doRemovePack() {
  showRemoveDialog.value = false;
  try {
    const result = await localRepository.removeContentPack(packToRemove.value);
    await questionStore.reload();
    await loadInstalledPacks();
    packStatus.value = `Pack removed: ${result.deleted} questions deleted, ${result.kept} user-modified kept.`;
    packStatusError.value = false;
  } catch (err) {
    packStatus.value = `Remove failed: ${err instanceof Error ? err.message : String(err)}`;
    packStatusError.value = true;
  }
}

async function loadInstalledPacks() {
  installedPacks.value = await localRepository.getInstalledPacks();
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

onMounted(async () => {
  await Promise.all([loadNotesCount(), loadInstalledPacks()]);
  if (questionStore.questions.length === 0) await questionStore.reload();
});
</script>
