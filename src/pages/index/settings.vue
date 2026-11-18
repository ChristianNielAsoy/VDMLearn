<template>
  <q-page class="q-pa-md" style="max-width: 640px; margin: 0 auto">
    <div class="text-h6 q-mb-md">Settings</div>

    <!-- Appearance -->
    <div class="text-overline text-grey-6 q-mb-xs">APPEARANCE</div>
    <q-card flat bordered class="q-mb-lg">
      <q-item tag="label" class="cursor-pointer">
        <q-item-section avatar>
          <q-icon
            :name="isDark ? 'dark_mode' : 'light_mode'"
            :color="isDark ? 'primary' : 'grey'"
          />
        </q-item-section>
        <q-item-section>
          <q-item-label>Dark Mode</q-item-label>
          <q-item-label caption>{{ isDark ? 'On' : 'Off' }}</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-toggle v-model="isDark" color="primary" @update:model-value="applyDark" />
        </q-item-section>
      </q-item>
    </q-card>

    <!-- Study behaviour -->
    <div class="text-overline text-grey-6 q-mb-xs">STUDY BEHAVIOUR</div>
    <q-card flat bordered class="q-mb-lg">
      <q-item tag="label" class="cursor-pointer">
        <q-item-section avatar>
          <q-icon name="psychology" color="primary" />
        </q-item-section>
        <q-item-section>
          <q-item-label>Confidence tap before answer</q-item-label>
          <q-item-label caption>
            Rate confidence after choosing but before seeing feedback (recommended)
          </q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-toggle
            :model-value="onboardingStore.showConfidenceTap"
            color="primary"
            @update:model-value="(v) => void onboardingStore.saveProfile({ showConfidenceTap: v })"
          />
        </q-item-section>
      </q-item>

      <q-separator inset />

      <q-item tag="label" class="cursor-pointer">
        <q-item-section avatar>
          <q-icon name="edit_note" color="primary" />
        </q-item-section>
        <q-item-section>
          <q-item-label>Self-explanation prompt</q-item-label>
          <q-item-label caption>Show "explain why" box after each answer (optional, ungraded)</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-toggle
            :model-value="onboardingStore.selfExplanation"
            color="primary"
            @update:model-value="(v) => void onboardingStore.saveProfile({ selfExplanation: v })"
          />
        </q-item-section>
      </q-item>

      <q-separator inset />

      <q-item tag="label" class="cursor-pointer">
        <q-item-section avatar>
          <q-icon name="shuffle" color="primary" />
        </q-item-section>
        <q-item-section>
          <q-item-label>Mix new-material sessions</q-item-label>
          <q-item-label caption>Interleave new items across subjects (due reviews always mixed)</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-toggle
            :model-value="onboardingStore.forceMixedSessions"
            color="primary"
            @update:model-value="(v) => void onboardingStore.saveProfile({ forceMixedSessions: v })"
          />
        </q-item-section>
      </q-item>
    </q-card>

    <!-- Data -->
    <div class="text-overline text-grey-6 q-mb-xs">DATA</div>
    <q-card flat bordered class="q-mb-lg">
      <q-item clickable v-ripple :disable="exporting" @click="doExport">
        <q-item-section avatar>
          <q-icon name="download" color="primary" />
        </q-item-section>
        <q-item-section>
          <q-item-label>Export Backup</q-item-label>
          <q-item-label caption>Download all local data as a JSON file</q-item-label>
        </q-item-section>
        <q-item-section v-if="exporting" side>
          <q-spinner color="primary" size="1rem" />
        </q-item-section>
      </q-item>

      <q-separator inset />

      <q-item clickable v-ripple @click="triggerFileInput">
        <q-item-section avatar>
          <q-icon name="upload_file" color="primary" />
        </q-item-section>
        <q-item-section>
          <q-item-label>Import Backup</q-item-label>
          <q-item-label caption
            >Restore from a backup JSON file (merges with existing data)</q-item-label
          >
        </q-item-section>
      </q-item>
      <input
        ref="fileInput"
        type="file"
        accept=".json,application/json"
        style="display: none"
        @change="handleFile"
      />

      <q-separator inset />

      <q-item clickable v-ripple @click="doExportUsageLog">
        <q-item-section avatar>
          <q-icon name="bar_chart" color="primary" />
        </q-item-section>
        <q-item-section>
          <q-item-label>Export usage log</q-item-label>
          <q-item-label caption>Download feature-open and session events as JSON (no external analytics)</q-item-label>
        </q-item-section>
      </q-item>

      <q-separator inset />

      <q-item clickable v-ripple @click="showClearDialog = true">
        <q-item-section avatar>
          <q-icon name="delete_forever" color="negative" />
        </q-item-section>
        <q-item-section>
          <q-item-label class="text-negative">Clear All Data</q-item-label>
          <q-item-label caption>
            Permanently delete all progress, SRS records, tasks, notes, and imported questions
          </q-item-label>
        </q-item-section>
      </q-item>
    </q-card>

    <!-- Status banner -->
    <q-banner
      v-if="statusMsg"
      rounded
      dense
      :class="statusError ? 'bg-negative text-white' : 'bg-positive text-white'"
      class="q-mb-md"
    >
      <template #avatar>
        <q-icon :name="statusError ? 'error' : 'check_circle'" color="white" />
      </template>
      {{ statusMsg }}
      <template #action>
        <q-btn flat color="white" icon="close" dense round @click="statusMsg = ''" />
      </template>
    </q-banner>

    <!-- About -->
    <div class="text-overline text-grey-6 q-mb-xs">ABOUT</div>
    <q-card flat bordered class="q-mb-md">
      <q-card-section>
        <div class="row items-center q-mb-xs">
          <q-icon name="school" color="primary" class="q-mr-sm" />
          <span class="text-body2 text-weight-medium">DVM Reviewer</span>
          <q-badge color="grey-4" text-color="grey-8" label="v0.1.0" class="q-ml-sm" />
        </div>
        <div class="text-caption text-grey q-mb-sm">
          A local-first VMLE preparation app for Philippine DVM students. No AI calls in the app —
          questions are generated offline and imported via JSON.
        </div>
        <q-banner rounded dense class="text-caption bg-amber-1 text-amber-9">
          <template #avatar>
            <q-icon name="info" color="amber-7" size="xs" />
          </template>
          For study purposes only — not clinical guidance. Verify exam dates and passing rules at
          <strong>prc.gov.ph</strong>.
        </q-banner>
      </q-card-section>
    </q-card>

    <!-- Clear data confirm -->
    <q-dialog v-model="showClearDialog" persistent>
      <q-card style="min-width: 280px; max-width: 440px">
        <q-card-section>
          <div class="text-body1 text-weight-medium text-negative q-mb-sm">Clear All Data?</div>
          <div class="text-body2">
            This permanently deletes all quiz attempts, SRS progress, bookmarks, lesson notes and
            statuses, school tasks, and imported questions. This cannot be undone.
          </div>
          <div class="text-caption text-grey q-mt-sm">Tip: export a backup first.</div>
        </q-card-section>
        <q-card-actions align="right" class="q-pb-md q-pr-md">
          <q-btn flat no-caps label="Cancel" v-close-popup />
          <q-btn
            unelevated
            no-caps
            color="negative"
            label="Delete Everything"
            @click="doClearAll"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { exportBackup, importBackup, clearAllLocalData } from '@/services/backup';
import { exportUsageLogJson } from '@/services/usageLog';
import { useOnboardingStore } from '@/stores/onboardingStore';

const $q = useQuasar();
const onboardingStore = useOnboardingStore();

const isDark = ref($q.dark.isActive);
const exporting = ref(false);
const showClearDialog = ref(false);
const statusMsg = ref('');
const statusError = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

onMounted(() => {
  isDark.value = $q.dark.isActive;
  void onboardingStore.load();
});

function applyDark(val: boolean) {
  $q.dark.set(val);
  localStorage.setItem('dvmr-dark', val ? '1' : '0');
}

async function doExport() {
  exporting.value = true;
  try {
    await exportBackup();
    showStatus('Backup downloaded successfully.', false);
  } catch (e) {
    showStatus(`Export failed: ${e instanceof Error ? e.message : String(e)}`, true);
  } finally {
    exporting.value = false;
  }
}

function triggerFileInput() {
  fileInput.value?.click();
}

async function handleFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  try {
    const { summary } = await importBackup(file);
    showStatus(
      summary.length ? `Restored: ${summary.join(', ')}.` : 'Backup was empty — nothing restored.',
      false,
    );
  } catch (err) {
    showStatus(`Import failed: ${err instanceof Error ? err.message : String(err)}`, true);
  } finally {
    if (fileInput.value) fileInput.value.value = '';
  }
}

async function doClearAll() {
  showClearDialog.value = false;
  try {
    await clearAllLocalData();
    showStatus('All local data cleared.', false);
  } catch {
    showStatus('Clear failed — please try again.', true);
  }
}

async function doExportUsageLog() {
  try {
    const json = await exportUsageLogJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dvmr-usage-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showStatus('Usage log downloaded.', false);
  } catch (e) {
    showStatus(`Export failed: ${e instanceof Error ? e.message : String(e)}`, true);
  }
}

function showStatus(msg: string, isError: boolean) {
  statusMsg.value = msg;
  statusError.value = isError;
}
</script>
