/**
 * Mastery + Readiness engine — pure functions, no Dexie, no Vue.
 *
 * Formula weights (all tunable constants):
 *   mastery = W_ACC * recentAccuracy + W_MEM * memoryStrength + W_COV * coverage
 *   W_ACC = 0.40, W_MEM = 0.40, W_COV = 0.20
 *
 * readiness = Σ (examWeightPct/100 * subjectMastery)
 * Always label results with isEstimate:true in the UI.
 */

import type { ReviewEvent } from '@/types/review';
import type { SrsProgress } from '@/types/progress';
import type { Question } from '@/types/question';
import type { VmleSubject } from '@/types/question';
import type { CompetencyNode } from '@/repositories/competency';

// ── Weights ────────────────────────────────────────────────────────────────

export const MASTERY_WEIGHTS = {
  accuracy: 0.4,
  memory: 0.4,
  coverage: 0.2,
} as const;

export const DEFAULT_RECENT_WINDOW_DAYS = 30;

// ── Output types ───────────────────────────────────────────────────────────

export interface CompetencyMastery {
  competencyId: string;
  text: string;
  subject: VmleSubject;
  examSharePct: number;
  tosItems: number;
  recentAccuracy: number;   // 0–1; NaN when no events in window
  memoryStrength: number;   // 0–1
  coverage: number;         // 0–1
  mastery: number;          // weighted composite 0–1
}

export interface SubjectReadiness {
  subject: VmleSubject;
  examWeightPct: number;
  competencyMasteries: CompetencyMastery[];
  subjectMastery: number;      // TOS-items-weighted avg of competency mastery
  meetsSubjectMin: boolean;    // subjectMastery*100 >= passRuleSubjectMinPct
}

export interface ReadinessReport {
  overallReadiness: number;      // 0–1
  meetsOverall: boolean;
  subjects: SubjectReadiness[];
  generatedAt: number;
  isEstimate: true;              // literal — always present; must appear in UI
}

export interface MasteryInput {
  reviewEvents: ReviewEvent[];
  allProgress: SrsProgress[];
  allQuestions: Question[];
  competencies: CompetencyNode[];
  passRuleOverallPct: number;    // default 75
  passRuleSubjectMinPct: number; // default 60
  now?: number;
  recentWindowDays?: number;     // default 30
}

// ── Core pure functions ────────────────────────────────────────────────────

/**
 * Estimate memory retention 0–1 from SRS progress using the forgetting curve.
 * SM-2: R = exp(-elapsed / interval)
 * FSRS: R = exp(ln(0.9) * elapsed / stability)  [9/10 retrievability at scheduled day]
 * Returns 0 for new items (no progress or interval=0).
 */
export function computeMemoryStrength(
  progress: SrsProgress | undefined,
  now: number,
): number {
  if (!progress) return 0;
  const elapsedDays = Math.max(0, (now - progress.lastSeenAt) / 86_400_000);

  if (progress.algorithm === 'fsrs' && progress.fsrsStability) {
    // FSRS retrievability formula
    const r = Math.exp(Math.log(0.9) * (elapsedDays / progress.fsrsStability));
    return Math.min(1, Math.max(0, r));
  }

  // SM-2 forgetting curve
  if (progress.intervalDays <= 0) return 0;
  const r = Math.exp(-elapsedDays / progress.intervalDays);
  return Math.min(1, Math.max(0, r));
}

/**
 * Recent accuracy for a specific set of question IDs in the given time window.
 * Returns NaN when no events exist (caller must handle NaN → treat as 0).
 */
export function computeRecentAccuracy(
  events: ReviewEvent[],
  questionIds: Set<string>,
  windowMs: number,
  now: number,
): number {
  const cutoff = now - windowMs;
  let total = 0;
  let correct = 0;
  for (const e of events) {
    if (e.ts < cutoff) continue;
    if (!questionIds.has(e.objectId)) continue;
    total++;
    if (e.correct) correct++;
  }
  return total === 0 ? NaN : correct / total;
}

/**
 * Coverage 0–1: distinct questions with at least one review event or SRS progress,
 * limited to the competency's question set, relative to TOS items.
 */
export function computeCoverage(
  questionIds: Set<string>,
  progressMap: Map<string, SrsProgress>,
  seenIds: Set<string>,
  tosItems: number,
): number {
  if (tosItems <= 0) return 0;
  let seen = 0;
  for (const qId of questionIds) {
    if (seenIds.has(qId) || progressMap.has(qId)) seen++;
  }
  return Math.min(1, seen / tosItems);
}

// ── Main entrypoint ────────────────────────────────────────────────────────

export function computeMastery(input: MasteryInput): ReadinessReport {
  const {
    reviewEvents,
    allProgress,
    allQuestions,
    competencies,
    passRuleOverallPct,
    passRuleSubjectMinPct,
  } = input;
  const now = input.now ?? Date.now();
  const windowDays = input.recentWindowDays ?? DEFAULT_RECENT_WINDOW_DAYS;
  const windowMs = windowDays * 86_400_000;

  // Build lookup maps
  const progressMap = new Map(allProgress.map((p) => [p.questionId, p]));
  const seenIds = new Set(reviewEvents.map((e) => e.objectId));

  // Group questions by competencyId (use first competencyId in array)
  const questionsByCompetency = new Map<string, Set<string>>();
  for (const q of allQuestions) {
    for (const cId of q.competencyIds) {
      if (!questionsByCompetency.has(cId)) questionsByCompetency.set(cId, new Set());
      questionsByCompetency.get(cId)!.add(q.id);
    }
  }

  // Group competencies by subject
  const competenciesBySubject = new Map<VmleSubject, CompetencyNode[]>();
  for (const c of competencies) {
    if (!competenciesBySubject.has(c.subject)) competenciesBySubject.set(c.subject, []);
    competenciesBySubject.get(c.subject)!.push(c);
  }

  const subjects: SubjectReadiness[] = [];
  let overallReadiness = 0;

  for (const [subject, subjectComps] of competenciesBySubject) {
    const competencyMasteries: CompetencyMastery[] = [];
    let totalItems = 0;
    let weightedMastery = 0;

    for (const comp of subjectComps) {
      const qIds = questionsByCompetency.get(comp.id) ?? new Set<string>();

      const rawAccuracy = computeRecentAccuracy(reviewEvents, qIds, windowMs, now);
      const recentAccuracy = Number.isNaN(rawAccuracy) ? 0 : rawAccuracy;

      // Memory strength: average across all questions in this competency that have progress
      let totalMemory = 0;
      let memCount = 0;
      for (const qId of qIds) {
        const prog = progressMap.get(qId);
        if (prog) {
          totalMemory += computeMemoryStrength(prog, now);
          memCount++;
        }
      }
      const memoryStrength = memCount > 0 ? totalMemory / memCount : 0;

      const coverage = computeCoverage(qIds, progressMap, seenIds, comp.items);

      const mastery =
        MASTERY_WEIGHTS.accuracy * recentAccuracy +
        MASTERY_WEIGHTS.memory * memoryStrength +
        MASTERY_WEIGHTS.coverage * coverage;

      competencyMasteries.push({
        competencyId: comp.id,
        text: comp.text,
        subject,
        examSharePct: comp.examSharePct,
        tosItems: comp.items,
        recentAccuracy,
        memoryStrength,
        coverage,
        mastery,
      });

      totalItems += comp.items;
      weightedMastery += comp.items * mastery;
    }

    const subjectMastery = totalItems > 0 ? weightedMastery / totalItems : 0;
    const examWeightPct = subjectComps[0]?.examSharePct
      ? Math.round(subjectComps.reduce((s, c) => s + c.examSharePct, 0))
      : 0;

    // Get examWeightPct from the first competency's subject weight
    // examSharePct = items/100 * examWeightPct, so examWeightPct = examSharePct*100/items
    const firstComp = subjectComps[0];
    const derivedExamWeightPct =
      firstComp && firstComp.items > 0
        ? Math.round((firstComp.examSharePct / firstComp.items) * 100)
        : examWeightPct;

    subjects.push({
      subject,
      examWeightPct: derivedExamWeightPct,
      competencyMasteries,
      subjectMastery,
      meetsSubjectMin: subjectMastery * 100 >= passRuleSubjectMinPct,
    });

    overallReadiness += (derivedExamWeightPct / 100) * subjectMastery;
  }

  return {
    overallReadiness: Math.min(1, overallReadiness),
    meetsOverall: overallReadiness * 100 >= passRuleOverallPct,
    subjects,
    generatedAt: now,
    isEstimate: true,
  };
}
