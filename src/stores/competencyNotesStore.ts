import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { localRepository } from '@/db/repository';
import type { CompetencyNote, ClozeCard, BlurtSession, MistakeEntry } from '@/types/notes';
import { extractAndConvert } from '@/services/clozeExtractor';
import { buildBlurtSession, buildBlurtReviewEvent } from '@/services/blurtMode';
import { buildReviewSheet } from '@/services/reviewSheet';
import type { ReviewSheet } from '@/services/reviewSheet';

export const useCompetencyNotesStore = defineStore('competencyNotes', () => {
  const notes = ref<Map<string, CompetencyNote>>(new Map());
  const clozeCards = ref<Map<string, ClozeCard[]>>(new Map());
  const blurtSessions = ref<Map<string, BlurtSession[]>>(new Map());
  const loading = ref(false);

  const allNotes = computed(() => [...notes.value.values()]);
  const noteCount = computed(() => notes.value.size);

  async function loadAll() {
    loading.value = true;
    try {
      const [allNoteArr, allCards, allSessions] = await Promise.all([
        localRepository.getAllCompetencyNotes(),
        localRepository.getAllClozeCards(),
        localRepository.getBlurtSessions(),
      ]);
      notes.value = new Map(allNoteArr.map((n) => [n.competencyId, n]));
      const cardsMap = new Map<string, ClozeCard[]>();
      for (const card of allCards) {
        const arr = cardsMap.get(card.competencyId) ?? [];
        arr.push(card);
        cardsMap.set(card.competencyId, arr);
      }
      clozeCards.value = cardsMap;
      const sessionsMap = new Map<string, BlurtSession[]>();
      for (const s of allSessions) {
        const arr = sessionsMap.get(s.competencyId) ?? [];
        arr.push(s);
        sessionsMap.set(s.competencyId, arr);
      }
      blurtSessions.value = sessionsMap;
    } finally {
      loading.value = false;
    }
  }

  async function loadNote(competencyId: string) {
    const note = await localRepository.getCompetencyNote(competencyId);
    if (note) notes.value.set(competencyId, note);
  }

  function getNote(competencyId: string): CompetencyNote | undefined {
    return notes.value.get(competencyId);
  }

  async function saveNote(competencyId: string, bodyMd: string): Promise<void> {
    await localRepository.saveCompetencyNote(competencyId, bodyMd);
    const note: CompetencyNote = { competencyId, bodyMd, updatedAt: Date.now() };
    notes.value.set(competencyId, note);

    // Auto-sync cloze cards: clear old note-highlight cards, re-extract
    await localRepository.clearClozeCardsForCompetency(competencyId);
    const extracts = extractAndConvert(bodyMd, competencyId);
    const newCards: ClozeCard[] = [];
    for (const card of extracts) {
      const id = await localRepository.appendClozeCard(card);
      newCards.push({ ...card, id });
    }
    // Preserve manually-added cards
    const existing = await localRepository.getClozeCardsForCompetency(competencyId);
    clozeCards.value.set(competencyId, existing);
  }

  async function deleteNote(competencyId: string): Promise<void> {
    await localRepository.deleteCompetencyNote(competencyId);
    notes.value.delete(competencyId);
    await localRepository.clearClozeCardsForCompetency(competencyId);
    clozeCards.value.delete(competencyId);
  }

  function getClozeCards(competencyId: string): ClozeCard[] {
    return clozeCards.value.get(competencyId) ?? [];
  }

  async function addManualClozeCard(
    competencyId: string,
    front: string,
    back: string,
  ): Promise<void> {
    const card: Omit<ClozeCard, 'id'> = {
      competencyId,
      front,
      back,
      source: 'manual',
      createdAt: Date.now(),
    };
    const id = await localRepository.appendClozeCard(card);
    const arr = clozeCards.value.get(competencyId) ?? [];
    arr.push({ ...card, id });
    clozeCards.value.set(competencyId, arr);
  }

  async function deleteClozeCard(competencyId: string, id: number): Promise<void> {
    await localRepository.deleteClozeCard(id);
    const arr = (clozeCards.value.get(competencyId) ?? []).filter((c) => c.id !== id);
    clozeCards.value.set(competencyId, arr);
  }

  async function recordBlurtSession(
    competencyId: string,
    selfScore: 1 | 2 | 3,
    sessionId: string,
    responseMs: number,
  ): Promise<void> {
    const now = Date.now();
    const session = buildBlurtSession(competencyId, selfScore, now);
    const id = await localRepository.appendBlurtSession(session);
    const arr = blurtSessions.value.get(competencyId) ?? [];
    arr.push({ ...session, id });
    blurtSessions.value.set(competencyId, arr);

    const reviewEvent = buildBlurtReviewEvent(competencyId, selfScore, sessionId, responseMs, now);
    await localRepository.appendReviewEvent(reviewEvent);
  }

  function getBlurtSessions(competencyId: string): BlurtSession[] {
    return blurtSessions.value.get(competencyId) ?? [];
  }

  function getReviewSheet(
    competencyId: string,
    mistakeEntries: MistakeEntry[],
  ): ReviewSheet | null {
    const note = getNote(competencyId);
    if (!note) return null;
    return buildReviewSheet(
      note,
      getClozeCards(competencyId),
      mistakeEntries,
      getBlurtSessions(competencyId),
    );
  }

  return {
    notes,
    clozeCards,
    blurtSessions,
    loading,
    allNotes,
    noteCount,
    loadAll,
    loadNote,
    getNote,
    saveNote,
    deleteNote,
    getClozeCards,
    addManualClozeCard,
    deleteClozeCard,
    recordBlurtSession,
    getBlurtSessions,
    getReviewSheet,
  };
});
