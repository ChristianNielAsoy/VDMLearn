import type { Attempt, ChoiceKey, Question } from '@/types/question';
import type { SrsProgress } from '@/types/progress';
import type { LessonStatus, UserLessonStatus, LessonNote } from '@/types/lesson';
import type { SchoolTask, PlannerSettings } from '@/types/task';
import type { ReviewEvent } from '@/types/review';
import type { InstalledPack, InstallResult, UpdateResult, RemoveResult, ContentPackManifest } from '@/types/contentPack';
import type { OnboardingProfile } from '@/types/onboarding';
import type { MistakeEntry, CompetencyNote, ClozeCard, BlurtSession } from '@/types/notes';
import type { ResourceEntry } from '@/types/resource';
import type { ChecklistProgress } from '@/types/checklist';
import { applyInstall, applyUpdate, applyRemove, buildInstalledPack } from '@/services/contentPack';
import { db } from './dexie';

export interface BackupData {
  attempts: Attempt[];
  progress: SrsProgress[];
  bookmarks: { questionId: string }[];
  flags: { questionId: string }[];
  importedQuestions: Question[];
  lessonStatus: UserLessonStatus[];
  lessonNotes: LessonNote[];
  tasks: SchoolTask[];
  plannerSettings: PlannerSettings[];
  reviewEvents: ReviewEvent[];
  contentPacks: InstalledPack[];
  onboardingProfile?: OnboardingProfile;
  mistakeEntries?: MistakeEntry[];
  competencyNotes?: CompetencyNote[];
  clozeCards?: ClozeCard[];
  blurtSessions?: BlurtSession[];
  resources?: ResourceEntry[];
}

const DEFAULT_PLANNER_SETTINGS: PlannerSettings = {
  id: 'singleton',
  examDate: new Date('2026-11-04').getTime(),
  weeklyQuestionGoal: 50,
  weeklyLessonGoal: 3,
};

export interface QuestionRepository {
  saveAttempt(questionId: string, chosen: ChoiceKey, correct: boolean): Promise<void>;
  getAllAttempts(): Promise<Attempt[]>;
  getAttemptsAfter(since: number): Promise<Attempt[]>;
  getAttemptsByQuestion(questionId: string): Promise<Attempt[]>;
  clearAll(): Promise<void>;

  upsertProgress(progress: SrsProgress): Promise<void>;
  getProgress(questionId: string): Promise<SrsProgress | undefined>;
  getAllProgress(): Promise<SrsProgress[]>;
  getDueProgress(now: number): Promise<SrsProgress[]>;

  addBookmark(questionId: string): Promise<void>;
  removeBookmark(questionId: string): Promise<void>;
  isBookmarked(questionId: string): Promise<boolean>;
  getBookmarks(): Promise<string[]>;

  addFlag(questionId: string): Promise<void>;
  removeFlag(questionId: string): Promise<void>;
  getFlaggedIds(): Promise<string[]>;

  importQuestions(questions: Question[]): Promise<{ added: number; updated: number }>;
  getImportedQuestions(): Promise<Question[]>;
  deleteImported(id: string): Promise<void>;
  clearImported(): Promise<void>;

  getLessonStatus(lessonId: string): Promise<LessonStatus>;
  setLessonStatus(lessonId: string, status: LessonStatus): Promise<void>;
  getAllLessonStatuses(): Promise<UserLessonStatus[]>;

  getLessonNote(lessonId: string): Promise<LessonNote | undefined>;
  saveLessonNote(lessonId: string, bodyMd: string): Promise<void>;

  getTasks(): Promise<SchoolTask[]>;
  addTask(task: SchoolTask): Promise<void>;
  updateTask(task: SchoolTask): Promise<void>;
  deleteTask(id: string): Promise<void>;

  getPlannerSettings(): Promise<PlannerSettings>;
  savePlannerSettings(settings: PlannerSettings): Promise<void>;

  appendReviewEvent(event: ReviewEvent): Promise<void>;
  getReviewEvents(since?: number): Promise<ReviewEvent[]>;
  getReviewEventsForObject(objectId: string): Promise<ReviewEvent[]>;

  installContentPack(manifest: ContentPackManifest, questions: Question[]): Promise<InstallResult>;
  updateContentPack(manifest: ContentPackManifest, questions: Question[]): Promise<UpdateResult>;
  removeContentPack(packId: string): Promise<RemoveResult>;
  getInstalledPacks(): Promise<InstalledPack[]>;

  getOnboardingProfile(): Promise<OnboardingProfile | undefined>;
  saveOnboardingProfile(profile: OnboardingProfile): Promise<void>;

  appendMistakeEntry(entry: Omit<MistakeEntry, 'id'>): Promise<number>;
  getMistakeEntries(since?: number): Promise<MistakeEntry[]>;
  getMistakeEntriesForQuestion(questionId: string): Promise<MistakeEntry[]>;
  deleteMistakeEntry(id: number): Promise<void>;
  clearMistakeEntries(): Promise<void>;

  getCompetencyNote(competencyId: string): Promise<CompetencyNote | undefined>;
  saveCompetencyNote(competencyId: string, bodyMd: string): Promise<void>;
  getAllCompetencyNotes(): Promise<CompetencyNote[]>;
  deleteCompetencyNote(competencyId: string): Promise<void>;

  appendClozeCard(card: Omit<ClozeCard, 'id'>): Promise<number>;
  getClozeCardsForCompetency(competencyId: string): Promise<ClozeCard[]>;
  getAllClozeCards(): Promise<ClozeCard[]>;
  deleteClozeCard(id: number): Promise<void>;
  clearClozeCardsForCompetency(competencyId: string): Promise<void>;

  appendBlurtSession(session: Omit<BlurtSession, 'id'>): Promise<number>;
  getBlurtSessionsForCompetency(competencyId: string): Promise<BlurtSession[]>;
  getBlurtSessions(since?: number): Promise<BlurtSession[]>;

  addResource(entry: Omit<ResourceEntry, 'id'>): Promise<number>;
  getResourcesForCompetency(competencyId: string): Promise<ResourceEntry[]>;
  deleteResource(id: number): Promise<void>;

  getChecklistProgress(checklistId: string): Promise<ChecklistProgress | undefined>;
  saveChecklistProgress(progress: ChecklistProgress): Promise<void>;
  getAllChecklistProgress(): Promise<ChecklistProgress[]>;

  exportAll(): Promise<BackupData>;
  importAll(data: Partial<BackupData>): Promise<void>;
}

export const localRepository: QuestionRepository = {
  async saveAttempt(questionId, chosen, correct) {
    await db.attempts.add({ questionId, chosen, correct, timestamp: Date.now() });
  },

  async getAllAttempts() {
    return db.attempts.toArray();
  },

  async getAttemptsAfter(since) {
    return db.attempts.where('timestamp').above(since).toArray();
  },

  async getAttemptsByQuestion(questionId) {
    return db.attempts.where('questionId').equals(questionId).toArray();
  },

  async clearAll() {
    await Promise.all([
      db.attempts.clear(),
      db.progress.clear(),
      db.bookmarks.clear(),
      db.flags.clear(),
      db.importedQuestions.clear(),
      db.lessonStatus.clear(),
      db.lessonNotes.clear(),
      db.tasks.clear(),
      db.plannerSettings.clear(),
      db.reviewEvents.clear(),
      db.mistakeEntries.clear(),
      db.competencyNotes.clear(),
      db.clozeCards.clear(),
      db.blurtSessions.clear(),
      db.resources.clear(),
      db.checklistProgress.clear(),
      // contentPacks intentionally excluded — user must uninstall packs explicitly
    ]);
  },

  async upsertProgress(progress) {
    await db.progress.put(progress);
  },

  async getProgress(questionId) {
    return db.progress.get(questionId);
  },

  async getAllProgress() {
    return db.progress.toArray();
  },

  async getDueProgress(now) {
    return db.progress.where('dueAt').belowOrEqual(now).toArray();
  },

  async addBookmark(questionId) {
    await db.bookmarks.put({ questionId });
  },

  async removeBookmark(questionId) {
    await db.bookmarks.delete(questionId);
  },

  async isBookmarked(questionId) {
    return (await db.bookmarks.get(questionId)) !== undefined;
  },

  async getBookmarks() {
    const rows = await db.bookmarks.toArray();
    return rows.map((r) => r.questionId);
  },

  async addFlag(questionId) {
    await db.flags.put({ questionId });
  },

  async removeFlag(questionId) {
    await db.flags.delete(questionId);
  },

  async getFlaggedIds() {
    const rows = await db.flags.toArray();
    return rows.map((r) => r.questionId);
  },

  async importQuestions(questions) {
    const ids = questions.map((q) => q.id);
    const existing = await db.importedQuestions.bulkGet(ids);
    const existingSet = new Set(existing.filter(Boolean).map((q) => q!.id));
    await db.importedQuestions.bulkPut(questions);
    const added = questions.filter((q) => !existingSet.has(q.id)).length;
    const updated = questions.length - added;
    return { added, updated };
  },

  async getImportedQuestions() {
    return db.importedQuestions.toArray();
  },

  async deleteImported(id) {
    await db.importedQuestions.delete(id);
  },

  async clearImported() {
    await db.importedQuestions.clear();
  },

  async getLessonStatus(lessonId) {
    const row = await db.lessonStatus.get(lessonId);
    return row?.status ?? 'unread';
  },

  async setLessonStatus(lessonId, status) {
    await db.lessonStatus.put({ lessonId, status, updatedAt: Date.now() });
  },

  async getAllLessonStatuses() {
    return db.lessonStatus.toArray();
  },

  async getLessonNote(lessonId) {
    return db.lessonNotes.get(lessonId);
  },

  async saveLessonNote(lessonId, bodyMd) {
    await db.lessonNotes.put({ lessonId, bodyMd, updatedAt: Date.now() });
  },

  async getTasks() {
    return db.tasks.orderBy('dueAt').toArray();
  },

  async addTask(task) {
    await db.tasks.put(task);
  },

  async updateTask(task) {
    await db.tasks.put(task);
  },

  async deleteTask(id) {
    await db.tasks.delete(id);
  },

  async getPlannerSettings() {
    return (await db.plannerSettings.get('singleton')) ?? DEFAULT_PLANNER_SETTINGS;
  },

  async savePlannerSettings(settings) {
    await db.plannerSettings.put(settings);
  },

  async appendReviewEvent(event) {
    await db.reviewEvents.add(event);
  },

  async getReviewEvents(since) {
    if (since !== undefined) {
      return db.reviewEvents.where('ts').aboveOrEqual(since).toArray();
    }
    return db.reviewEvents.toArray();
  },

  async getReviewEventsForObject(objectId) {
    return db.reviewEvents.where('objectId').equals(objectId).toArray();
  },

  async installContentPack(manifest, questions) {
    const existingArr = await db.importedQuestions.toArray();
    const existingMap = new Map(existingArr.map((q) => [q.id, q]));
    const { toAdd, skipped } = applyInstall(questions, existingMap);
    await db.importedQuestions.bulkPut(toAdd);
    const pack = buildInstalledPack(manifest, toAdd.length + skipped);
    await db.contentPacks.put(pack);
    return { packId: manifest.packId, added: toAdd.length, skipped };
  },

  async updateContentPack(manifest, questions) {
    const existingArr = await db.importedQuestions.toArray();
    const existingMap = new Map(existingArr.map((q) => [q.id, q]));
    const { toUpdate, skipped } = applyUpdate(questions, existingMap, manifest.packId);
    await db.importedQuestions.bulkPut(toUpdate);
    const existing = await db.contentPacks.get(manifest.packId);
    if (existing) {
      await db.contentPacks.put({ ...existing, version: manifest.version, questionCount: toUpdate.length + skipped });
    }
    return { packId: manifest.packId, updated: toUpdate.length, skipped };
  },

  async removeContentPack(packId) {
    const allQuestions = await db.importedQuestions.toArray();
    const { toDelete, kept } = applyRemove(allQuestions, packId);
    await db.importedQuestions.bulkDelete(toDelete);
    await db.contentPacks.delete(packId);
    return { packId, deleted: toDelete.length, kept };
  },

  async getInstalledPacks() {
    return db.contentPacks.toArray();
  },

  async getOnboardingProfile() {
    return db.onboardingProfile.get('singleton');
  },

  async saveOnboardingProfile(profile) {
    await db.onboardingProfile.put(profile);
  },

  async appendMistakeEntry(entry) {
    return db.mistakeEntries.add(entry);
  },

  async getMistakeEntries(since) {
    if (since !== undefined) {
      return db.mistakeEntries.where('ts').aboveOrEqual(since).toArray();
    }
    return db.mistakeEntries.toArray();
  },

  async getMistakeEntriesForQuestion(questionId) {
    return db.mistakeEntries.where('questionId').equals(questionId).toArray();
  },

  async deleteMistakeEntry(id) {
    await db.mistakeEntries.delete(id);
  },

  async clearMistakeEntries() {
    await db.mistakeEntries.clear();
  },

  async getCompetencyNote(competencyId) {
    return db.competencyNotes.get(competencyId);
  },

  async saveCompetencyNote(competencyId, bodyMd) {
    await db.competencyNotes.put({ competencyId, bodyMd, updatedAt: Date.now() });
  },

  async getAllCompetencyNotes() {
    return db.competencyNotes.toArray();
  },

  async deleteCompetencyNote(competencyId) {
    await db.competencyNotes.delete(competencyId);
  },

  async appendClozeCard(card) {
    return db.clozeCards.add(card);
  },

  async getClozeCardsForCompetency(competencyId) {
    return db.clozeCards.where('competencyId').equals(competencyId).toArray();
  },

  async getAllClozeCards() {
    return db.clozeCards.toArray();
  },

  async deleteClozeCard(id) {
    await db.clozeCards.delete(id);
  },

  async clearClozeCardsForCompetency(competencyId) {
    await db.clozeCards.where('competencyId').equals(competencyId).delete();
  },

  async appendBlurtSession(session) {
    return db.blurtSessions.add(session);
  },

  async getBlurtSessionsForCompetency(competencyId) {
    return db.blurtSessions.where('competencyId').equals(competencyId).toArray();
  },

  async getBlurtSessions(since) {
    if (since !== undefined) {
      return db.blurtSessions.where('ts').aboveOrEqual(since).toArray();
    }
    return db.blurtSessions.toArray();
  },

  async addResource(entry) {
    return db.resources.add(entry);
  },

  async getResourcesForCompetency(competencyId) {
    return db.resources.where('competencyId').equals(competencyId).toArray();
  },

  async deleteResource(id) {
    await db.resources.delete(id);
  },

  async getChecklistProgress(checklistId) {
    return db.checklistProgress.get(checklistId);
  },

  async saveChecklistProgress(progress) {
    await db.checklistProgress.put(progress);
  },

  async getAllChecklistProgress() {
    return db.checklistProgress.toArray();
  },

  async exportAll(): Promise<BackupData> {
    const [attempts, progress, bookmarks, flags, importedQuestions, lessonStatus, lessonNotes, tasks, plannerSettings, reviewEvents, contentPacks, onboardingArr, mistakeEntries, competencyNotes, clozeCards, blurtSessions, resources] =
      await Promise.all([
        db.attempts.toArray(),
        db.progress.toArray(),
        db.bookmarks.toArray(),
        db.flags.toArray(),
        db.importedQuestions.toArray(),
        db.lessonStatus.toArray(),
        db.lessonNotes.toArray(),
        db.tasks.toArray(),
        db.plannerSettings.toArray(),
        db.reviewEvents.toArray(),
        db.contentPacks.toArray(),
        db.onboardingProfile.toArray(),
        db.mistakeEntries.toArray(),
        db.competencyNotes.toArray(),
        db.clozeCards.toArray(),
        db.blurtSessions.toArray(),
        db.resources.toArray(),
      ]);
    const result: BackupData = { attempts, progress, bookmarks, flags, importedQuestions, lessonStatus, lessonNotes, tasks, plannerSettings, reviewEvents, contentPacks };
    const onboarding = onboardingArr[0];
    if (onboarding) result.onboardingProfile = onboarding;
    if (mistakeEntries.length > 0) result.mistakeEntries = mistakeEntries;
    if (competencyNotes.length > 0) result.competencyNotes = competencyNotes;
    if (clozeCards.length > 0) result.clozeCards = clozeCards;
    if (blurtSessions.length > 0) result.blurtSessions = blurtSessions;
    if (resources.length > 0) result.resources = resources;
    return result;
  },

  async importAll(data: Partial<BackupData>): Promise<void> {
    const ops: Promise<unknown>[] = [];
    if (data.attempts?.length) ops.push(db.attempts.bulkPut(data.attempts));
    if (data.progress?.length) ops.push(db.progress.bulkPut(data.progress));
    if (data.bookmarks?.length) ops.push(db.bookmarks.bulkPut(data.bookmarks));
    if (data.flags?.length) ops.push(db.flags.bulkPut(data.flags));
    if (data.importedQuestions?.length) ops.push(db.importedQuestions.bulkPut(data.importedQuestions));
    if (data.lessonStatus?.length) ops.push(db.lessonStatus.bulkPut(data.lessonStatus));
    if (data.lessonNotes?.length) ops.push(db.lessonNotes.bulkPut(data.lessonNotes));
    if (data.tasks?.length) ops.push(db.tasks.bulkPut(data.tasks));
    if (data.plannerSettings?.length) ops.push(db.plannerSettings.bulkPut(data.plannerSettings));
    if (data.reviewEvents?.length) ops.push(db.reviewEvents.bulkPut(data.reviewEvents));
    if (data.contentPacks?.length) ops.push(db.contentPacks.bulkPut(data.contentPacks));
    if (data.onboardingProfile) ops.push(db.onboardingProfile.put(data.onboardingProfile));
    if (data.mistakeEntries?.length) ops.push(db.mistakeEntries.bulkPut(data.mistakeEntries));
    if (data.competencyNotes?.length) ops.push(db.competencyNotes.bulkPut(data.competencyNotes));
    if (data.clozeCards?.length) ops.push(db.clozeCards.bulkPut(data.clozeCards));
    if (data.blurtSessions?.length) ops.push(db.blurtSessions.bulkPut(data.blurtSessions));
    if (data.resources?.length) ops.push(db.resources.bulkPut(data.resources));
    await Promise.all(ops);
  },
};
