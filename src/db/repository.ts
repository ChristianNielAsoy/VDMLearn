import type { Attempt, ChoiceKey, Question } from '@/types/question';
import type { SrsProgress } from '@/types/progress';
import type { LessonStatus, UserLessonStatus, LessonNote } from '@/types/lesson';
import type { SchoolTask, PlannerSettings } from '@/types/task';
import type { ReviewEvent } from '@/types/review';
import type { InstalledPack, InstallResult, UpdateResult, RemoveResult, ContentPackManifest } from '@/types/contentPack';
import { applyInstall, applyUpdate, applyRemove, buildInstalledPack } from '@/services/contentPack';
import { db } from './dexie';

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
    await db.attempts.clear();
    await db.progress.clear();
    await db.bookmarks.clear();
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
};
