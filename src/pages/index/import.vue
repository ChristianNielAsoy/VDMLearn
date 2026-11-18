<template>
  <q-page class="q-pa-md" style="max-width: 640px; margin: 0 auto">
    <div class="text-h6 q-mb-xs">Import Questions</div>
    <div class="text-caption text-grey q-mb-md">
      Paste a JSON array of questions generated with the prompt template.
    </div>

    <q-banner rounded dense class="text-caption bg-amber-1 text-amber-9 q-mb-md">
      <template #avatar>
        <q-icon name="info" color="amber-7" />
      </template>
      All imported questions are saved as <strong>unverified</strong>. Return in 24 h to verify
      each one against its cited source.
    </q-banner>

    <!-- Pending verification -->
    <template v-if="verifiable.length > 0">
      <div class="text-subtitle2 text-grey-7 q-mb-xs row items-center">
        <q-icon name="verified" color="positive" size="xs" class="q-mr-xs" />
        Ready to verify ({{ verifiable.length }})
      </div>
      <q-card flat bordered class="q-mb-lg">
        <q-list dense separator>
          <q-item v-for="q in verifiable" :key="q.id" class="q-py-sm">
            <q-item-section>
              <q-item-label class="text-caption ellipsis">{{ q.stem }}</q-item-label>
              <q-item-label caption class="text-grey-6">{{ q.source }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-btn
                unelevated
                dense
                no-caps
                size="sm"
                color="positive"
                label="Verify"
                :loading="verifying === q.id"
                @click="markVerified(q.id)"
              />
            </q-item-section>
          </q-item>
        </q-list>
      </q-card>
    </template>

    <!-- JSON input -->
    <q-input
      v-model="rawJson"
      type="textarea"
      outlined
      label="Paste JSON here"
      hint="Array of question objects, or a single question object"
      rows="10"
      :error="!!parseError"
      :error-message="parseError"
      class="q-mb-sm font-mono"
      style="font-family: monospace; font-size: 12px"
    />

    <div class="row q-gutter-sm q-mb-md">
      <q-btn
        color="primary"
        label="Validate"
        unelevated
        no-caps
        :disable="!rawJson.trim()"
        @click="validate"
      />
      <q-btn flat label="Clear" no-caps :disable="!rawJson.trim()" @click="clear" />
    </div>

    <!-- Validation result -->
    <div v-if="result">
      <!-- Errors -->
      <q-list v-if="result.errors.length > 0" dense bordered separator rounded class="q-mb-md">
        <q-item-label header class="text-negative text-body2">
          {{ result.errors.length }} error{{ result.errors.length !== 1 ? 's' : '' }}
        </q-item-label>
        <q-item v-for="(err, i) in result.errors" :key="i" class="q-py-xs">
          <q-item-section avatar>
            <q-icon name="error" color="negative" size="xs" />
          </q-item-section>
          <q-item-section>
            <q-item-label class="text-caption">
              Question {{ err.index }}{{ err.id ? ` (${err.id})` : '' }}: {{ err.message }}
            </q-item-label>
          </q-item-section>
        </q-item>
      </q-list>

      <!-- Duplicate ID warnings -->
      <q-banner
        v-if="result.duplicateIds.length > 0"
        rounded
        dense
        class="text-caption bg-orange-1 text-warning q-mb-md"
      >
        <template #avatar>
          <q-icon name="warning" color="warning" />
        </template>
        Duplicate IDs found (will overwrite existing):
        {{ result.duplicateIds.join(', ') }}
      </q-banner>

      <!-- Stem warnings -->
      <q-banner
        v-if="result.warnings.length > 0"
        rounded
        dense
        class="text-caption bg-blue-1 text-blue-9 q-mb-md"
      >
        <template #avatar>
          <q-icon name="info" color="blue-7" />
        </template>
        <div v-for="(w, i) in result.warnings" :key="i">{{ w }}</div>
      </q-banner>

      <!-- Valid preview -->
      <q-card v-if="result.valid.length > 0" flat bordered class="q-mb-md">
        <q-card-section class="q-py-sm">
          <div class="row items-center">
            <q-icon name="check_circle" color="positive" size="sm" class="q-mr-sm" />
            <span class="text-body2 text-positive text-weight-medium">
              {{ result.valid.length }} valid question{{ result.valid.length !== 1 ? 's' : '' }}
            </span>
          </div>
          <div class="text-caption text-grey q-mt-xs">
            Subjects:
            {{ [...new Set(result.valid.map((q) => q.vmleSubject))].join(', ') }}
          </div>
        </q-card-section>
        <q-separator />
        <q-list dense>
          <q-item v-for="q in result.valid.slice(0, 5)" :key="q.id" class="q-py-xs">
            <q-item-section>
              <q-item-label class="text-caption ellipsis">{{ q.stem }}</q-item-label>
              <q-item-label caption class="text-grey-6"
                >{{ q.vmleSubject }} · {{ q.competencyId }}</q-item-label
              >
            </q-item-section>
          </q-item>
          <q-item v-if="result.valid.length > 5" class="q-py-xs">
            <q-item-section>
              <q-item-label class="text-caption text-grey">
                … and {{ result.valid.length - 5 }} more
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card>

      <!-- Import button -->
      <q-btn
        v-if="result.valid.length > 0"
        color="positive"
        unelevated
        no-caps
        class="full-width"
        style="min-height: 48px"
        :loading="importing"
        @click="doImport"
      >
        <q-icon name="upload" class="q-mr-sm" />
        Import {{ result.valid.length }} Question{{ result.valid.length !== 1 ? 's' : '' }}
      </q-btn>
    </div>

    <!-- Success -->
    <q-banner v-if="importSuccess" rounded class="bg-positive text-white q-mt-md">
      <template #avatar>
        <q-icon name="check_circle" color="white" />
      </template>
      Imported {{ lastImportCount }} question{{ lastImportCount !== 1 ? 's' : '' }}. Return in 24 h
      to verify them in the panel above.
      <template #action>
        <q-btn flat color="white" label="Browse" to="/" no-caps @click="$emit('imported')" />
      </template>
    </q-banner>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { validateImport, isVerifiable, type ImportResult } from '@/services/importer';
import { localRepository } from '@/db/repository';
import { useQuestionStore } from '@/stores/questionStore';
import type { Question } from '@/types/question';

const questionStore = useQuestionStore();

const rawJson = ref('');
const parseError = ref('');
const result = ref<ImportResult | null>(null);
const importing = ref(false);
const importSuccess = ref(false);
const lastImportCount = ref(0);
const importedQuestions = ref<Question[]>([]);
const verifying = ref<string | null>(null);

const verifiable = computed(() => importedQuestions.value.filter(isVerifiable));

async function loadImported() {
  importedQuestions.value = await localRepository.getImportedQuestions();
}

onMounted(() => void loadImported());

function validate() {
  parseError.value = '';
  result.value = null;
  importSuccess.value = false;

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson.value.trim());
  } catch (e) {
    parseError.value = `Invalid JSON: ${e instanceof Error ? e.message : String(e)}`;
    return;
  }

  result.value = validateImport(parsed);
}

async function doImport() {
  if (!result.value || result.value.valid.length === 0) return;
  importing.value = true;
  try {
    const { added, updated } = await localRepository.importQuestions(result.value.valid);
    lastImportCount.value = added + updated;
    await questionStore.reload();
    await loadImported();
    importSuccess.value = true;
    rawJson.value = '';
    result.value = null;
  } finally {
    importing.value = false;
  }
}

async function markVerified(id: string) {
  verifying.value = id;
  try {
    await localRepository.setImportedQuestionStatus(id, 'verified');
    await loadImported();
    await questionStore.reload();
  } finally {
    verifying.value = null;
  }
}

function clear() {
  rawJson.value = '';
  parseError.value = '';
  result.value = null;
  importSuccess.value = false;
}
</script>
