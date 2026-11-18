/**
 * Session builder — maps duration to item counts and assembles a session plan.
 *
 * Average time per item: AVG_SECONDS_PER_ITEM (30 s).
 * Items per duration: 10 min → 20, 20 min → 40, 45 min → 90.
 */

import type { Question } from '@/types/question';
import type { ScoredItem } from './itemPriority';
import { buildInterleaved } from './itemPriority';

// ── Constants ──────────────────────────────────────────────────────────────

export type SessionLength = 10 | 20 | 45;

export const AVG_SECONDS_PER_ITEM = 30;

export const ITEMS_PER_DURATION: Record<SessionLength, number> = {
  10: 20,
  20: 40,
  45: 90,
};

// ── Types ──────────────────────────────────────────────────────────────────

export interface SessionConfig {
  durationMinutes: SessionLength;
  includeNew?: boolean; // default true
  includeWeak?: boolean; // default true
  includeDue?: boolean; // default true
  newItemBudget?: number; // max new items (already filtered by scoreItems)
  /** Interleave items across subjects. Due-queue sessions always interleave; new-material sessions respect this flag. Default true. */
  interleave?: boolean;
}

export interface SessionPlan {
  questions: Question[];
  estimatedMinutes: number;
  dueCount: number;
  newCount: number;
  weakCount: number;
}

// ── Core function ──────────────────────────────────────────────────────────

/**
 * Build a session from pre-scored items.
 * Applies category filters, respects target count, and interleaves across subjects.
 */
export function buildSession(config: SessionConfig, scored: ScoredItem[]): SessionPlan {
  const {
    durationMinutes,
    includeNew = true,
    includeWeak = true,
    includeDue = true,
    interleave = true,
  } = config;

  const targetCount = ITEMS_PER_DURATION[durationMinutes];

  // Filter by requested categories (a due item may also be weak — include if any category matches)
  const filtered = scored.filter((item) => {
    if (item.isNew && includeNew) return true;
    if (item.isOverdue && includeDue) return true;
    if (item.isWeak && includeWeak) return true;
    // Include non-new, non-overdue review items when includeDue is true
    if (!item.isNew && includeDue) return true;
    return false;
  });

  const questions = interleave
    ? buildInterleaved(filtered, targetCount)
    : filtered.slice(0, targetCount).map((s) => s.question);

  // Counts based on the selected items (a question can be both weak and overdue)
  const selectedIds = new Set(questions.map((q) => q.id));
  const selectedItems = filtered.filter((s) => selectedIds.has(s.question.id));

  return {
    questions,
    estimatedMinutes: Math.round((questions.length * AVG_SECONDS_PER_ITEM) / 60),
    dueCount: selectedItems.filter((s) => s.isOverdue).length,
    newCount: selectedItems.filter((s) => s.isNew).length,
    weakCount: selectedItems.filter((s) => s.isWeak && !s.isOverdue).length,
  };
}
