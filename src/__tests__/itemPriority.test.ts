import { describe, it, expect } from 'vitest';
import {
  detectLeeches,
  scoreItems,
  buildInterleaved,
  DEFAULT_LEECH_THRESHOLD,
} from '@/services/itemPriority';
import type { ReviewEvent } from '@/types/review';
import type { SrsProgress } from '@/types/progress';
import type { Question } from '@/types/question';
import type { CompetencyNode } from '@/repositories/competency';

const NOW = 1_720_000_000_000;
const DAY = 86_400_000;

function makeEvent(overrides: Partial<ReviewEvent> = {}): ReviewEvent {
  return {
    objectId: 'q1',
    activityType: 'mcq',
    correct: true,
    rating: 3,
    confidence: 2,
    responseMs: 3000,
    mode: 'competency',
    sessionId: 's1',
    ts: NOW - DAY,
    ...overrides,
  };
}

function makeProgress(questionId: string, overrides: Partial<SrsProgress> = {}): SrsProgress {
  return {
    questionId,
    attempts: 2,
    correct: 1,
    ease: 2.5,
    intervalDays: 7,
    dueAt: NOW + DAY,
    lastSeenAt: NOW - 2 * DAY,
    ...overrides,
  };
}

function makeQ(id: string, subject: Question['vmleSubject'] = 'Veterinary Anatomy'): Question {
  return {
    id,
    type: 'question',
    competencyIds: ['Veterinary Anatomy:A.1'],
    courseRefs: [],
    links: [],
    origin: { type: 'ai-draft', ref: 'test' },
    status: 'unverified',
    updatedAt: 0,
    version: 1,
    year: 2,
    subject: 'Gross Anatomy',
    vmleSubject: subject,
    competencyId: 'Veterinary Anatomy:A.1',
    stem: 'Which bone is the longest in the dog body?',
    choices: [
      { key: 'A', text: 'Femur' },
      { key: 'B', text: 'Tibia' },
      { key: 'C', text: 'Humerus' },
      { key: 'D', text: 'Radius' },
    ],
    answer: 'A',
    explanation: 'Femur.',
    sourceType: 'ai-draft',
    source: 'test',
  };
}

function makeCompetencyMap(): Map<string, CompetencyNode> {
  return new Map([
    [
      'Veterinary Anatomy:A.1',
      {
        id: 'Veterinary Anatomy:A.1',
        subject: 'Veterinary Anatomy',
        sectionId: 'A',
        text: 'Osteology',
        items: 5,
        examSharePct: 0.5,
      },
    ],
  ]);
}

// ── detectLeeches ──────────────────────────────────────────────────────────

describe('detectLeeches', () => {
  it('returns empty set when no events', () => {
    expect(detectLeeches([])).toEqual(new Set());
  });

  it('does not flag when consecutive wrong count < threshold', () => {
    const events = [
      makeEvent({ objectId: 'q1', correct: false, ts: NOW - 3 * DAY }),
      makeEvent({ objectId: 'q1', correct: false, ts: NOW - 2 * DAY }),
      makeEvent({ objectId: 'q1', correct: false, ts: NOW - DAY }),
    ];
    expect(detectLeeches(events, 4).has('q1')).toBe(false);
  });

  it('flags when consecutive wrong count === threshold', () => {
    const events = Array.from({ length: DEFAULT_LEECH_THRESHOLD }, (_, i) =>
      makeEvent({ objectId: 'q1', correct: false, ts: NOW - (i + 1) * DAY }),
    );
    expect(detectLeeches(events).has('q1')).toBe(true);
  });

  it('streak resets after a correct answer', () => {
    const events = [
      makeEvent({ objectId: 'q1', correct: true, ts: NOW - 5 * DAY }),
      makeEvent({ objectId: 'q1', correct: false, ts: NOW - 4 * DAY }),
      makeEvent({ objectId: 'q1', correct: false, ts: NOW - 3 * DAY }),
      makeEvent({ objectId: 'q1', correct: false, ts: NOW - 2 * DAY }),
      makeEvent({ objectId: 'q1', correct: false, ts: NOW - DAY }),
    ];
    // 4 wrong in a row but a correct was before them → should flag (streak=4 from most recent)
    expect(detectLeeches(events, 4).has('q1')).toBe(true);
  });

  it('does not flag when most recent answer is correct', () => {
    const events = [
      makeEvent({ objectId: 'q1', correct: false, ts: NOW - 4 * DAY }),
      makeEvent({ objectId: 'q1', correct: false, ts: NOW - 3 * DAY }),
      makeEvent({ objectId: 'q1', correct: false, ts: NOW - 2 * DAY }),
      makeEvent({ objectId: 'q1', correct: true, ts: NOW - DAY }), // correct breaks streak
    ];
    expect(detectLeeches(events, 4).has('q1')).toBe(false);
  });

  it('flags multiple objects independently', () => {
    const events = [
      ...Array.from({ length: 4 }, (_, i) =>
        makeEvent({ objectId: 'q1', correct: false, ts: NOW - (i + 1) * DAY }),
      ),
      ...Array.from({ length: 4 }, (_, i) =>
        makeEvent({ objectId: 'q2', correct: false, ts: NOW - (i + 1) * DAY }),
      ),
    ];
    const leeches = detectLeeches(events);
    expect(leeches.has('q1')).toBe(true);
    expect(leeches.has('q2')).toBe(true);
  });
});

// ── scoreItems ─────────────────────────────────────────────────────────────

describe('scoreItems', () => {
  const competencyMap = makeCompetencyMap();

  it('returns empty when no questions', () => {
    const result = scoreItems({
      questions: [],
      allProgress: new Map(),
      reviewEvents: [],
      competencyMap,
      now: NOW,
    });
    expect(result).toHaveLength(0);
  });

  it('overdue items score higher than non-overdue', () => {
    const overdue = makeQ('overdue');
    const notDue = makeQ('not-due');
    const progress = new Map([
      ['overdue', makeProgress('overdue', { dueAt: NOW - 3 * DAY })], // overdue
      ['not-due', makeProgress('not-due', { dueAt: NOW + 3 * DAY })], // not yet due
    ]);
    const scored = scoreItems({
      questions: [notDue, overdue],
      allProgress: progress,
      reviewEvents: [],
      competencyMap,
      now: NOW,
    });
    const overdueScore = scored.find((s) => s.question.id === 'overdue')!.score;
    const notDueScore = scored.find((s) => s.question.id === 'not-due')!.score;
    expect(overdueScore).toBeGreaterThan(notDueScore);
  });

  it('weak items have higher score than non-weak (similar other factors)', () => {
    const weak = makeQ('weak');
    const strong = makeQ('strong');
    const progress = new Map([
      ['weak', makeProgress('weak', { dueAt: NOW + DAY })],
      ['strong', makeProgress('strong', { dueAt: NOW + DAY })],
    ]);
    const events: ReviewEvent[] = [
      // weak: many wrong answers
      ...Array.from({ length: 5 }, (_, i) =>
        makeEvent({ objectId: 'weak', correct: false, ts: NOW - (i + 1) * 1000 }),
      ),
      // strong: many correct answers
      ...Array.from({ length: 5 }, (_, i) =>
        makeEvent({ objectId: 'strong', correct: true, ts: NOW - (i + 1) * 1000 }),
      ),
    ];
    const scored = scoreItems({
      questions: [strong, weak],
      allProgress: progress,
      reviewEvents: events,
      competencyMap,
      now: NOW,
    });
    const weakScore = scored.find((s) => s.question.id === 'weak')!.score;
    const strongScore = scored.find((s) => s.question.id === 'strong')!.score;
    expect(weakScore).toBeGreaterThan(strongScore);
  });

  it('new items are capped by newItemBudget', () => {
    const questions = Array.from({ length: 10 }, (_, i) => makeQ(`new-${i}`));
    const scored = scoreItems({
      questions,
      allProgress: new Map(),
      reviewEvents: [],
      competencyMap,
      now: NOW,
      newItemBudget: 3,
    });
    expect(scored.filter((s) => s.isNew)).toHaveLength(3);
  });

  it('results are sorted descending by score', () => {
    const questions = [makeQ('q1'), makeQ('q2'), makeQ('q3')];
    const progress = new Map([
      ['q1', makeProgress('q1', { dueAt: NOW - 5 * DAY })],
      ['q2', makeProgress('q2', { dueAt: NOW - DAY })],
      ['q3', makeProgress('q3', { dueAt: NOW + 5 * DAY })],
    ]);
    const scored = scoreItems({
      questions,
      allProgress: progress,
      reviewEvents: [],
      competencyMap,
      now: NOW,
    });
    for (let i = 0; i < scored.length - 1; i++) {
      expect(scored[i]!.score).toBeGreaterThanOrEqual(scored[i + 1]!.score);
    }
  });

  it('marks leeches correctly', () => {
    const q = makeQ('leech-q');
    const progress = new Map([['leech-q', makeProgress('leech-q')]]);
    const events = Array.from({ length: 4 }, (_, i) =>
      makeEvent({ objectId: 'leech-q', correct: false, ts: NOW - (i + 1) * DAY }),
    );
    const scored = scoreItems({
      questions: [q],
      allProgress: progress,
      reviewEvents: events,
      competencyMap,
      now: NOW,
    });
    expect(scored[0]!.isLeech).toBe(true);
  });
});

// ── buildInterleaved ───────────────────────────────────────────────────────

describe('buildInterleaved', () => {
  it('returns empty for empty input', () => {
    expect(buildInterleaved([], 10)).toHaveLength(0);
  });

  it('returns at most targetCount items', () => {
    const items = Array.from({ length: 20 }, (_, i) => ({
      question: makeQ(`q${i}`, 'Veterinary Anatomy'),
      score: i,
      isNew: false,
      isOverdue: false,
      isWeak: false,
      isLeech: false,
    }));
    expect(buildInterleaved(items, 5)).toHaveLength(5);
  });

  it('no two consecutive items share the same subject when multiple subjects available', () => {
    const subjects: Question['vmleSubject'][] = [
      'Veterinary Anatomy',
      'Veterinary Physiology',
      'Zootechnics',
    ];
    const items = subjects.flatMap((subj, si) =>
      Array.from({ length: 4 }, (_, i) => ({
        question: makeQ(`${subj}-${i}`, subj),
        score: 10 - si,
        isNew: false,
        isOverdue: false,
        isWeak: false,
        isLeech: false,
      })),
    );
    const result = buildInterleaved(items, 9);
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i]!.vmleSubject).not.toBe(result[i + 1]!.vmleSubject);
    }
  });
});
