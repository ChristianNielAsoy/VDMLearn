import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useQuizStore } from '@/stores/quizStore';
import type { Question } from '@/types/question';

// Minimal repository mock — quizStore only needs saveAttempt, getProgress, upsertProgress, appendReviewEvent
vi.mock('@/db/repository', () => ({
  localRepository: {
    saveAttempt: vi.fn().mockResolvedValue(undefined),
    getProgress: vi.fn().mockResolvedValue(null),
    upsertProgress: vi.fn().mockResolvedValue(undefined),
    appendReviewEvent: vi.fn().mockResolvedValue(undefined),
  },
}));

// Stub scheduler so tests don't depend on FSRS/SM-2 internals
vi.mock('@/services/scheduler', () => ({
  getActiveScheduler: () => ({
    fromLegacyProgress: () => null,
    computeNextState: () => ({
      objectId: 'q',
      algorithm: 'sm2',
      dueAt: Date.now() + 86400000,
      lastSeenAt: Date.now(),
      data: { attempts: 1, correct: 1, ease: 2.5, intervalDays: 1 },
    }),
    toSrsProgress: (s: { objectId: string }) => ({
      questionId: s.objectId,
      attempts: 1,
      correct: 1,
      ease: 2.5,
      intervalDays: 1,
      dueAt: Date.now() + 86400000,
      lastSeenAt: Date.now(),
    }),
    isDue: () => false,
  }),
}));

function makeQuestion(id: string, answer: 'A' | 'B' | 'C' | 'D' = 'A'): Question {
  return {
    id,
    year: 2,
    subject: 'Anatomy',
    vmleSubject: 'Veterinary Anatomy',
    competencyId: 'Veterinary Anatomy:A.1.1',
    stem: `Question ${id}`,
    choices: [
      { key: 'A', text: 'Choice A' },
      { key: 'B', text: 'Choice B' },
      { key: 'C', text: 'Choice C' },
      { key: 'D', text: 'Choice D' },
    ],
    answer,
    explanation: 'Explanation',
    sourceType: 'own-notes',
    source: 'Test',
    status: 'unverified',
    type: 'question',
    origin: { type: 'own-notes', ref: 'Test' },
    competencyIds: ['Veterinary Anatomy:A.1.1'],
    courseRefs: [],
    links: [],
    updatedAt: 0,
    version: 1,
  };
}

describe('quizStore — confidence-before-feedback flow', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('selectChoice with showConfidenceTap=true sets awaitingConfidence, not answered', () => {
    const store = useQuizStore();
    store.startQuiz([makeQuestion('q1')], { type: 'competency', label: 'Test' });

    store.selectChoice('A', true);

    expect(store.awaitingConfidence).toBe(true);
    expect(store.answered).toBe(false);
    expect(store.selectedChoice).toBe('A');
  });

  it('selectChoice with showConfidenceTap=false goes directly to answered', async () => {
    const store = useQuizStore();
    store.startQuiz([makeQuestion('q1')], { type: 'competency', label: 'Test' });

    store.selectChoice('A', false);
    await new Promise((r) => setTimeout(r, 10));

    expect(store.awaitingConfidence).toBe(false);
    expect(store.answered).toBe(true);
  });

  it('confirmWithConfidence clears awaitingConfidence and sets answered', async () => {
    const store = useQuizStore();
    store.startQuiz([makeQuestion('q1')], { type: 'competency', label: 'Test' });

    store.selectChoice('A', true);
    expect(store.awaitingConfidence).toBe(true);

    await store.confirmWithConfidence(3);

    expect(store.awaitingConfidence).toBe(false);
    expect(store.answered).toBe(true);
    expect(store.pendingConfidence).toBe(3);
  });

  it('confidence is recorded correctly in pendingConfidence', async () => {
    const store = useQuizStore();
    store.startQuiz([makeQuestion('q1')], { type: 'competency', label: 'Test' });

    store.selectChoice('B', true);
    await store.confirmWithConfidence(1);

    expect(store.pendingConfidence).toBe(1);
  });

  it('next() resets awaitingConfidence', async () => {
    const store = useQuizStore();
    store.startQuiz([makeQuestion('q1'), makeQuestion('q2')], {
      type: 'competency',
      label: 'Test',
    });

    store.selectChoice('A', true);
    await store.confirmWithConfidence(2);
    await store.next();

    expect(store.awaitingConfidence).toBe(false);
    expect(store.answered).toBe(false);
  });

  it('selectChoice is ignored when already answered', async () => {
    const store = useQuizStore();
    store.startQuiz([makeQuestion('q1')], { type: 'competency', label: 'Test' });

    await store.submitAnswer('A');
    store.selectChoice('B', true);

    expect(store.selectedChoice).toBe('A');
  });

  it('selectChoice is ignored when awaitingConfidence is active', () => {
    const store = useQuizStore();
    store.startQuiz([makeQuestion('q1')], { type: 'competency', label: 'Test' });

    store.selectChoice('A', true);
    store.selectChoice('B', true); // second tap should be ignored

    expect(store.selectedChoice).toBe('A');
  });
});

describe('quizStore — high-confidence wrong answer retest queue', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('wrong answer with confidence=3 is re-queued when advancing past the last question', async () => {
    const store = useQuizStore();
    const q1 = makeQuestion('q1', 'A');
    const q2 = makeQuestion('q2', 'A');
    store.startQuiz([q1, q2], { type: 'competency', label: 'Test' });

    // Answer q1 wrong with high confidence, advance to q2
    store.selectChoice('B', true);
    await store.confirmWithConfidence(3); // confident but wrong
    expect(store.sessionResults[0]!.correct).toBe(false);
    await store.next();

    // q1 is now in retestQueue, not yet merged
    expect(store.retestQueue.map((q) => q.id)).toContain('q1');

    // Answer q2 correctly, then advance past the end → retest merges
    await store.submitAnswer('A');
    await store.next();

    // q1 should now be appended to the main queue
    expect(store.queue.length).toBe(3);
    expect(store.queue[2]!.id).toBe('q1');
    expect(store.retestQueue.length).toBe(0);
  });

  it('correct answer with confidence=3 does NOT go into retestQueue', async () => {
    const store = useQuizStore();
    const q1 = makeQuestion('q1', 'A');
    const q2 = makeQuestion('q2', 'A');
    store.startQuiz([q1, q2], { type: 'competency', label: 'Test' });

    store.selectChoice('A', true);
    await store.confirmWithConfidence(3); // correct with high confidence

    const prevQueueLen = store.queue.length;
    await store.next();

    // No retest — queue length unchanged at this point
    expect(store.queue.length).toBe(prevQueueLen);
  });

  it('wrong answer with confidence=1 does NOT go into retestQueue', async () => {
    const store = useQuizStore();
    const q1 = makeQuestion('q1', 'A');
    const q2 = makeQuestion('q2', 'A');
    store.startQuiz([q1, q2], { type: 'competency', label: 'Test' });

    store.selectChoice('B', true);
    await store.confirmWithConfidence(1); // wrong but low confidence

    const prevQueueLen = store.queue.length;
    await store.next();

    expect(store.queue.length).toBe(prevQueueLen);
  });
});

describe('quizStore — missedQuestions + retry', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('missedQuestions returns questions answered incorrectly', async () => {
    const store = useQuizStore();
    const q1 = makeQuestion('q1', 'A');
    const q2 = makeQuestion('q2', 'A');
    store.startQuiz([q1, q2], { type: 'competency', label: 'Test' });

    await store.submitAnswer('B'); // wrong
    await store.next();
    await store.submitAnswer('A'); // correct

    expect(store.missedQuestions.map((q) => q.id)).toEqual(['q1']);
  });

  it('startQuiz with missedQuestions retries only wrong answers', async () => {
    const store = useQuizStore();
    const q1 = makeQuestion('q1', 'A');
    const q2 = makeQuestion('q2', 'A');
    store.startQuiz([q1, q2], { type: 'competency', label: 'Test' });

    await store.submitAnswer('B');
    await store.next();
    await store.submitAnswer('A');

    const missed = store.missedQuestions;
    store.startQuiz(missed, { type: 'competency', label: 'Test — Retry missed' });

    expect(store.queue.length).toBe(1);
    expect(store.queue[0]!.id).toBe('q1');
  });
});
