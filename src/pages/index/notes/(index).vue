<template>
  <q-page class="column" style="max-width: 600px; margin: 0 auto">
    <div class="q-px-md q-pt-md q-pb-sm row items-center">
      <div class="text-h6 text-weight-semibold col" style="letter-spacing: -0.01em">My Notes</div>
      <q-btn
        flat
        no-caps
        color="primary"
        label="New Note"
        icon="add"
        size="sm"
        @click="showNewDialog = true"
      />
    </div>

    <q-separator />

    <!-- Search -->
    <div class="q-px-md q-py-sm">
      <q-input
        v-model="search"
        dense
        outlined
        placeholder="Search competency or note content…"
        clearable
      >
        <template #prepend><q-icon name="search" /></template>
      </q-input>
    </div>

    <div v-if="notesStore.loading" class="text-center q-pa-xl">
      <q-spinner color="primary" size="2rem" />
    </div>

    <div v-else-if="filtered.length === 0" class="text-center text-grey-5 q-pa-xl">
      <q-icon name="description" size="3rem" color="grey-3" />
      <div class="q-mt-sm">
        {{ notesStore.allNotes.length === 0 ? 'No notes yet.' : 'No matches.' }}
      </div>
      <div v-if="notesStore.allNotes.length === 0" class="text-caption q-mt-xs">
        Open a competency from Browse and tap "Take Notes".
      </div>
    </div>

    <q-list v-else separator class="col">
      <q-item
        v-for="note in filtered"
        :key="note.competencyId"
        clickable
        @click="openNote(note.competencyId)"
      >
        <q-item-section>
          <q-item-label class="text-body2 text-weight-medium ellipsis">{{
            note.competencyId
          }}</q-item-label>
          <q-item-label caption class="text-grey-6 ellipsis" style="max-width: 340px">{{
            preview(note.bodyMd)
          }}</q-item-label>
        </q-item-section>
        <q-item-section side>
          <div class="text-caption text-grey-5">{{ timeAgo(note.updatedAt) }}</div>
          <div class="row items-center q-gutter-xs q-mt-xs">
            <q-badge
              v-if="notesStore.getClozeCards(note.competencyId).length > 0"
              color="primary"
              :label="`${notesStore.getClozeCards(note.competencyId).length} cards`"
              size="xs"
            />
          </div>
        </q-item-section>
      </q-item>
    </q-list>

    <!-- New note dialog -->
    <q-dialog v-model="showNewDialog">
      <q-card style="min-width: 300px">
        <q-card-section class="text-h6">New Note</q-card-section>
        <q-card-section>
          <q-input
            v-model="newCompetencyId"
            label="Competency ID"
            hint='e.g. "Veterinary Anatomy:A.1"'
            outlined
            autofocus
            @keydown.enter="createNote"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn
            unelevated
            color="primary"
            label="Create"
            :disable="!newCompetencyId.trim()"
            @click="createNote"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useCompetencyNotesStore } from '@/stores/competencyNotesStore';

const router = useRouter();
const notesStore = useCompetencyNotesStore();

const search = ref('');
const showNewDialog = ref(false);
const newCompetencyId = ref('');

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return notesStore.allNotes;
  return notesStore.allNotes.filter(
    (n) => n.competencyId.toLowerCase().includes(q) || n.bodyMd.toLowerCase().includes(q),
  );
});

onMounted(() => notesStore.loadAll());

function openNote(competencyId: string) {
  void router.push(`/notes/${encodeURIComponent(competencyId)}`);
}

function createNote() {
  const id = newCompetencyId.value.trim();
  if (!id) return;
  showNewDialog.value = false;
  newCompetencyId.value = '';
  router.push(`/notes/${encodeURIComponent(id)}`).catch(() => undefined);
}

function preview(bodyMd: string): string {
  return bodyMd
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_`=]/g, '')
    .trim()
    .slice(0, 80);
}

function timeAgo(ts: number): string {
  if (!ts) return '';
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
</script>
