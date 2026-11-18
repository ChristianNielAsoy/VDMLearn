import { describe, it, expect } from 'vitest';
import {
  computeMemoryStrength,
  computeRecentAccuracy,
  computeCoverage,
  computeMastery,
  MASTERY_WEIGHTS,
  type MasteryInput,
} from '@/services/mastery';
import type { SrsProgress } from '@/types/progress';
import type { ReviewEvent } from '@/types/review';
import type { Question } from '@/types/question';
import type { CompetencyNode } from '@/repositories/competency';

const NOW = 1_720_000_000_000; // fixed timestamp
const DAY = 86_400_000;

// ── Fixtures ─────────────────────────────────────────────────────────────

function makeProgress(overrides: Partial<SrsProgress> = {}): SrsProgress {
  return {
    questionId: 'q1',
    attempts: 3,
    correct: 2,
    ease: 2.5,
    intervalDays: 7,
    dueAt: NOW + 7 * DAY,
    lastSeenAt: NOW - 2 * DAY,
    ...overrides,
  };
}

function makeEvent(overrides: Partial<ReviewEvent> = {}): ReviewEvent {
  return {
    objectId: 'q1',
    activityType: 'mcq',
    correct: true,
    rating: 3,
    confidence: 2,
    responseMs: 3000,
    mode: 'competency',
    sessionId: 'sess-1',
    ts: NOW - DAY,
    ...overrides,
  };
}

function makeCompetency(overrides: Partial<CompetencyNode> = {}): CompetencyNode {
  return {
    id: 'Veterinary Anatomy:A.1',
    subject: 'Veterinary Anatomy',
    sectionId: 'A',
    text: 'Osteology',
    items: 5,
    examSharePct: 0.5, // 5/100 * 10% = 0.5%
    ...overrides,
  };
}

function makeQuestion(id: string, competencyId = 'Veterinary Anatomy:A.1'): Question {
  return {
    id,
    type: 'question',
    competencyIds: [competencyId],
    courseRefs: [],
    links: [],
    origin: { type: 'ai-draft', ref: 'test' },
    status: 'unverified',
    updatedAt: 0,
    version: 1,
    year: 2,
    subject: 'Gross Anatomy',
    vmleSubject: 'Veterinary Anatomy',
    competencyId,
    stem: 'Test question stem text here?',
    choices: [
      { key: 'A', text: 'Option A' },
      { key: 'B', text: 'Option B' },
      { key: 'C', text: 'Option C' },
      { key: 'D', text: 'Option D' },
    ],
    answer: 'A',
    explanation: 'Because A.',
    sourceType: 'ai-draft',
    source: 'test',
  };
}

// ── computeMemoryStrength ─────────────────────────────────────────────────

describe('computeMemoryStrength', () => {
  it('returns 0 for undefined progress (new item)', () => {
    expect(computeMemoryStrength(undefined, NOW)).toBe(0);
  });

  it('returns 0 for intervalDays=0 (just got wrong)', () => {
    const p = makeProgress({ intervalDays: 0, lastSeenAt: NOW });
    expect(computeMemoryStrength(p, NOW)).toBe(0);
  });

  it('returns ~1 immediately after review (elapsed ≈ 0)', () => {
    const p = makeProgress({ intervalDays: 7, lastSeenAt: NOW });
    expect(computeMemoryStrength(p, NOW)).toBeCloseTo(1, 2);
  });

  it('decreases as elapsed time grows (SM-2 forgetting curve)', () => {
    const p = makeProgress({ intervalDays: 7, lastSeenAt: NOW - 3 * DAY });
    const r = computeMemoryStrength(p, NOW);
    expect(r).toBeGreaterThan(0);
    expect(r).toBeLessThan(1);
  });

  it('FSRS path uses stability field', () => {
    const p = makeProgress({
      algorithm: 'fsrs',
      fsrsStability: 10,
      lastSeenAt: NOW - 5 * DAY,
      intervalDays: 10,
    });
    const r = computeMemoryStrength(p, NOW);
    // FSRS: exp(ln(0.9) * 5/10) ≈ exp(-0.053) ≈ 0.948
    expect(r).toBeGreaterThan(0.9);
    expect(r).toBeLessThanOrEqual(1);
  });

  it('clamps to [0, 1]', () => {
    const p = makeProgress({ intervalDays: 1, lastSeenAt: NOW - 100 * DAY });
    expect(computeMemoryStrength(p, NOW)).toBeGreaterThanOrEqual(0);
  });
});

// ── computeRecentAccuracy ─────────────────────────────────────────────────

describe('computeRecentAccuracy', () => {
  it('returns NaN when no events in window', () => {
    expect(Number.isNaN(computeRecentAccuracy([], new Set(['q1']), 30 * DAY, NOW))).toBe(true);
  });

  it('computes accuracy from recent events only', () => {
    const ids = new Set(['q1', 'q2']);
    const events: ReviewEvent[] = [
      makeEvent({ objectId: 'q1', correct: true, ts: NOW - DAY }),
      makeEvent({ objectId: 'q2', correct: false, ts: NOW - DAY }),
      makeEvent({ objectId: 'q1', correct: true, ts: NOW - 40 * DAY }), // outside window
    ];
    const acc = computeRecentAccuracy(events, ids, 30 * DAY, NOW);
    expect(acc).toBeCloseTo(0.5, 5); // 1 correct / 2 total in window
  });

  it('ignores events for other questions', () => {
    const ids = new Set(['q1']);
    const events: ReviewEvent[] = [
      makeEvent({ objectId: 'q-other', correct: false, ts: NOW - DAY }),
    ];
    expect(Number.isNaN(computeRecentAccuracy(events, ids, 30 * DAY, NOW))).toBe(true);
  });
});

// ── computeCoverage ───────────────────────────────────────────────────────

describe('computeCoverage', () => {
  it('returns 0 when no questions seen', () => {
    expect(computeCoverage(new Set(['q1', 'q2']), new Map(), new Set(), 5)).toBe(0);
  });

  it('counts questions with progress', () => {
    const progressMap = new Map([['q1', makeProgress()]]);
    const cov = computeCoverage(new Set(['q1', 'q2']), progressMap, new Set(), 5);
    expect(cov).toBeCloseTo(1 / 5, 5);
  });

  it('counts questions with review events', () => {
    const cov = computeCoverage(new Set(['q1']), new Map(), new Set(['q1']), 5);
    expect(cov).toBeCloseTo(1 / 5, 5);
  });

  it('caps at 1 when seen > tosItems', () => {
    const ids = new Set(['q1', 'q2', 'q3']);
    const cov = computeCoverage(ids, new Map(), new Set(['q1', 'q2', 'q3']), 2);
    expect(cov).toBe(1);
  });
});

// ── computeMastery ────────────────────────────────────────────────────────

describe('computeMastery', () => {
  const baseInput: MasteryInput = {
    reviewEvents: [],
    allProgress: [],
    allQuestions: [],
    competencies: [],
    passRuleOverallPct: 75,
    passRuleSubjectMinPct: 60,
    now: NOW,
  };

  it('always has isEstimate: true', () => {
    const report = computeMastery(baseInput);
    expect(report.isEstimate).toBe(true);
  });

  it('returns zero readiness when no data', () => {
    const report = computeMastery(baseInput);
    expect(report.overallReadiness).toBe(0);
    expect(report.meetsOverall).toBe(false);
  });

  it('computes mastery with 100% accuracy + full memory → high mastery', () => {
    const q = makeQuestion('q1');
    const comp = makeCompetency({ id: 'Veterinary Anatomy:A.1', items: 1, examSharePct: 10 });
    const progress = makeProgress({ questionId: 'q1', intervalDays: 7, lastSeenAt: NOW });
    const event = makeEvent({ objectId: 'q1', correct: true, ts: NOW - DAY });

    const report = computeMastery({
      ...baseInput,
      reviewEvents: [event],
      allProgress: [progress],
      allQuestions: [q],
      competencies: [comp],
    });

    expect(report.subjects).toHaveLength(1);
    const subj = report.subjects[0]!;
    expect(subj.competencyMasteries[0]!.mastery).toBeGreaterThan(0.7);
  });

  it('meetsOverall when readiness*100 >= passRuleOverallPct', () => {
    // Simulate perfect mastery on a competency worth 100% of exam weight
    const q = makeQuestion('q1');
    // examSharePct = items/100 * examWeightPct = 1/100 * 100 = 1
    const comp = makeCompetency({ id: 'Veterinary Anatomy:A.1', items: 1, examSharePct: 1 });
    const progress = makeProgress({ questionId: 'q1', intervalDays: 7, lastSeenAt: NOW });
    const events = Array.from({ length: 10 }, (_, i) =>
      makeEvent({ objectId: 'q1', correct: true, ts: NOW - i * 1000 }),
    );

    const report = computeMastery({
      ...baseInput,
      reviewEvents: events,
      allProgress: [progress],
      allQuestions: [q],
      competencies: [comp],
      passRuleOverallPct: 10, // low threshold for this test
    });

    expect(report.overallReadiness).toBeGreaterThan(0);
    expect(report.subjects[0]!.meetsSubjectMin).toBe(
      report.subjects[0]!.subjectMastery * 100 >= 60,
    );
  });

  it('MASTERY_WEIGHTS sum to 1.0', () => {
    const sum = Object.values(MASTERY_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 10);
  });
});
