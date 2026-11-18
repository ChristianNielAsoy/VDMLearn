/**
 * Next-item priority scoring, leech detection, and interleaving.
 *
 * Priority score (additive, all weights named constants):
 *   overdue bonus  = clamp(elapsedOverdueDays * W_OVERDUE, 0, MAX_OVERDUE_BONUS)
 *   weakness bonus = (1 - recentAccuracy) * W_WEAKNESS
 *   exam weight    = examSharePct * W_EXAM_WEIGHT
 *   new item       = -W_NEW_PENALTY (controlled by budget)
 *   total          = overdue + weakness + exam weight − new penalty
 *
 * Leech: >= LEECH_THRESHOLD consecutive wrong answers for the same objectId.
 * Leeches are still shown (flagging is the caller's responsibility).
 */

import type { Question } from '@/types/question';
import type { SrsProgress } from '@/types/progress';
import type { ReviewEvent } from '@/types/review';
import type { CompetencyNode } from '@/repositories/competency';

// ── Weights ────────────────────────────────────────────────────────────────

export const PRIORITY_WEIGHTS = {
  overdue: 30, // points per overdue day
  maxOverduebonus: 60, // cap
  weakness: 25, // multiplied by (1 - accuracy)
  examWeight: 20, // multiplied by examSharePct
  newPenalty: 15, // subtracted for new items
} as const;

export const DEFAULT_LEECH_THRESHOLD = 4;
export const DEFAULT_NEW_ITEM_BUDGET = 10;

// ── Types ──────────────────────────────────────────────────────────────────

export interface PriorityInput {
  questions: Question[];
  allProgress: Map<string, SrsProgress>;
  reviewEvents: ReviewEvent[];
  competencyMap: Map<string, CompetencyNode>; // keyed by competencyId
  now: number;
  newItemBudget?: number;
  leechThreshold?: number;
  recentWindowMs?: number; // default 30 days
}

export interface ScoredItem {
  question: Question;
  score: number;
  isNew: boolean;
  isOverdue: boolean;
  isWeak: boolean;
  isLeech: boolean;
}

// ── Pure functions ─────────────────────────────────────────────────────────

/**
 * Detect leeches — items with >= threshold consecutive wrong answers (most recent streak).
 * Scans events per objectId in reverse-chronological order.
 */
export function detectLeeches(
  events: ReviewEvent[],
  threshold: number = DEFAULT_LEECH_THRESHOLD,
): Set<string> {
  // Group events by objectId, sorted ascending by ts
  const byObject = new Map<string, ReviewEvent[]>();
  for (const e of events) {
    if (!byObject.has(e.objectId)) byObject.set(e.objectId, []);
    byObject.get(e.objectId)!.push(e);
  }

  const leeches = new Set<string>();
  for (const [objectId, objEvents] of byObject) {
    // Sort descending (most recent first) and count consecutive wrong streak
    const sorted = objEvents.slice().sort((a, b) => b.ts - a.ts);
    let streak = 0;
    for (const e of sorted) {
      if (!e.correct) {
        streak++;
        if (streak >= threshold) {
          leeches.add(objectId);
          break;
        }
      } else {
        break; // streak broken by correct answer
      }
    }
  }
  return leeches;
}

/**
 * Compute recent accuracy (last recentWindowMs) for a given question id.
 * Returns NaN when no events exist.
 */
function recentAccuracyFor(
  events: ReviewEvent[],
  objectId: string,
  windowMs: number,
  now: number,
): number {
  const cutoff = now - windowMs;
  let total = 0;
  let correct = 0;
  for (const e of events) {
    if (e.objectId !== objectId || e.ts < cutoff) continue;
    total++;
    if (e.correct) correct++;
  }
  return total === 0 ? NaN : correct / total;
}

/**
 * Score and classify all items. New items are capped by newItemBudget.
 */
export function scoreItems(input: PriorityInput): ScoredItem[] {
  const {
    questions,
    allProgress,
    reviewEvents,
    competencyMap,
    now,
    newItemBudget = DEFAULT_NEW_ITEM_BUDGET,
    leechThreshold = DEFAULT_LEECH_THRESHOLD,
    recentWindowMs = 30 * 86_400_000,
  } = input;

  const leeches = detectLeeches(reviewEvents, leechThreshold);
  const scored: ScoredItem[] = [];
  let newItemCount = 0;

  for (const q of questions) {
    const progress = allProgress.get(q.id);
    const isNew = !progress;

    if (isNew && newItemCount >= newItemBudget) continue;
    if (isNew) newItemCount++;

    const isOverdue = progress ? progress.dueAt <= now : false;
    const overdueDays = isOverdue ? (now - progress!.dueAt) / 86_400_000 : 0;

    // Recent accuracy for weakness detection
    const rawAccuracy = recentAccuracyFor(reviewEvents, q.id, recentWindowMs, now);
    const accuracy = Number.isNaN(rawAccuracy) ? 0.5 : rawAccuracy; // neutral when no data
    const isWeak = !isNew && accuracy < 0.6;

    // Exam weight from best-matching competency
    let examSharePct = 0;
    for (const cId of q.competencyIds) {
      const node = competencyMap.get(cId);
      if (node) examSharePct = Math.max(examSharePct, node.examSharePct);
    }

    const overduebonus = Math.min(
      overdueDays * PRIORITY_WEIGHTS.overdue,
      PRIORITY_WEIGHTS.maxOverduebonus,
    );
    const weaknessBonus = (1 - accuracy) * PRIORITY_WEIGHTS.weakness;
    const examBonus = examSharePct * PRIORITY_WEIGHTS.examWeight;
    const newPenalty = isNew ? PRIORITY_WEIGHTS.newPenalty : 0;

    const score = overduebonus + weaknessBonus + examBonus - newPenalty;

    scored.push({
      question: q,
      score,
      isNew,
      isOverdue,
      isWeak,
      isLeech: leeches.has(q.id),
    });
  }

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);
  return scored;
}

/**
 * Interleave questions across VMLE subjects so no two consecutive items share
 * the same subject when avoidable. Falls back to score order when subjects run out.
 */
export function buildInterleaved(scored: ScoredItem[], targetCount: number): Question[] {
  const n = Math.min(targetCount, scored.length);
  if (n === 0) return [];

  // Group by vmleSubject, preserving score order within each bucket
  const buckets = new Map<string, ScoredItem[]>();
  for (const item of scored) {
    const subj = item.question.vmleSubject;
    if (!buckets.has(subj)) buckets.set(subj, []);
    buckets.get(subj)!.push(item);
  }

  const result: Question[] = [];
  let lastSubject: string | null = null;
  const subjectKeys = [...buckets.keys()];

  while (result.length < n) {
    let picked = false;

    // Try to pick from a different subject than the last one
    for (const subj of subjectKeys) {
      if (subj === lastSubject) continue;
      const bucket = buckets.get(subj)!;
      if (bucket.length === 0) continue;
      const item = bucket.shift()!;
      result.push(item.question);
      lastSubject = subj;
      picked = true;
      break;
    }

    if (!picked) {
      // All remaining items share the same subject — just pick the next one
      for (const subj of subjectKeys) {
        const bucket = buckets.get(subj)!;
        if (bucket.length === 0) continue;
        const item = bucket.shift()!;
        result.push(item.question);
        lastSubject = subj;
        break;
      }
    }
  }

  return result;
}
