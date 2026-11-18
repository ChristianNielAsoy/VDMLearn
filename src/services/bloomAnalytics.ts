/**
 * Bloom's taxonomy performance analytics.
 *
 * Aggregates review event accuracy by Bloom level for a given question set.
 * TOS target percentages come from bloomTotals in vmle-tos-2024.json.
 */

import type { BloomLevel, VmleSubject } from '@/types/question';
import type { Question } from '@/types/question';
import type { ReviewEvent } from '@/types/review';
import { loadTos } from '@/data/loaders/tos';

// ── Constants ──────────────────────────────────────────────────────────────

export const BLOOM_LEVELS: BloomLevel[] = ['R', 'U', 'Ap', 'An', 'E', 'C'];

export const BLOOM_LABELS: Record<BloomLevel, string> = {
  R: 'Remembering',
  U: 'Understanding',
  Ap: 'Applying',
  An: 'Analyzing',
  E: 'Evaluating',
  C: 'Creating',
};

// ── Types ──────────────────────────────────────────────────────────────────

export interface BloomPerformance {
  level: BloomLevel;
  label: string;
  attempts: number;
  correct: number;
  accuracy: number; // 0–1; NaN when attempts === 0
  tosTargetPct: number; // from bloomTotals in TOS for the subject (0 if unknown)
}

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Retrieve the TOS bloom target percentages for a subject (or aggregate across all subjects).
 * Returns partial record — levels with 0 in TOS are omitted from the result but
 * callers that request a level explicitly still get 0.
 */
export function getTosBloomTargets(subject?: VmleSubject): Record<BloomLevel, number> {
  const tos = loadTos();
  const totals: Record<BloomLevel, number> = { R: 0, U: 0, Ap: 0, An: 0, E: 0, C: 0 };

  const subjects = subject ? tos.subjects.filter((s) => s.name === subject) : tos.subjects;

  for (const s of subjects) {
    for (const [key, val] of Object.entries(s.bloomTotals)) {
      if (key in totals) {
        totals[key as BloomLevel] += val;
      }
    }
  }

  return totals;
}

// ── Core function ──────────────────────────────────────────────────────────

/**
 * Compute per-Bloom-level accuracy from review events.
 *
 * Only events for questions present in the `questions` map are counted.
 * If `subject` is provided, further restricts to questions with that vmleSubject.
 * `tosTargets` overrides TOS lookup (useful in tests).
 *
 * Returns one entry per BloomLevel that has at least one question in the filtered
 * question set; levels with no tagged questions are omitted.
 */
export function computeBloomPerformance(
  events: ReviewEvent[],
  questions: Map<string, Question>,
  subject?: VmleSubject,
  tosTargets?: Record<BloomLevel, number>,
): BloomPerformance[] {
  const targets = tosTargets ?? getTosBloomTargets(subject);

  // Build a set of question ids to consider (optionally filtered by subject)
  const relevantIds = new Set<string>();
  const levelForId = new Map<string, BloomLevel>();
  for (const [id, q] of questions) {
    if (subject && q.vmleSubject !== subject) continue;
    if (!q.bloomLevel) continue;
    relevantIds.add(id);
    levelForId.set(id, q.bloomLevel);
  }

  // Accumulate attempts/correct per level
  const acc = new Map<BloomLevel, { attempts: number; correct: number }>();
  for (const level of BLOOM_LEVELS) {
    // Only create an entry if the level is represented in the question set
    for (const [, bloomLvl] of levelForId) {
      if (bloomLvl === level) {
        if (!acc.has(level)) acc.set(level, { attempts: 0, correct: 0 });
        break;
      }
    }
  }

  for (const e of events) {
    if (!relevantIds.has(e.objectId)) continue;
    const level = levelForId.get(e.objectId);
    if (!level) continue;
    const entry = acc.get(level);
    if (!entry) continue;
    entry.attempts++;
    if (e.correct) entry.correct++;
  }

  // Build result in canonical Bloom order
  const result: BloomPerformance[] = [];
  for (const level of BLOOM_LEVELS) {
    const entry = acc.get(level);
    if (!entry) continue;
    result.push({
      level,
      label: BLOOM_LABELS[level],
      attempts: entry.attempts,
      correct: entry.correct,
      accuracy: entry.attempts === 0 ? NaN : entry.correct / entry.attempts,
      tosTargetPct: targets[level] ?? 0,
    });
  }

  return result;
}
