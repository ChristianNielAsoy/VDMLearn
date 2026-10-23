import { describe, it, expect, beforeEach } from 'vitest';
import { activityRegistry } from '@/activities/registry';
// Importing these modules triggers self-registration
import { mcqActivity } from '@/activities/mcq';
import { flashcardActivity, type FlashcardItem } from '@/activities/flashcard';
import type { Question } from '@/types/question';

// Minimal Question fixture satisfying the full type (M1 fields included)
const baseQuestion: Question = {
  id: 'test-0001',
  type: 'question',
  competencyIds: ['Veterinary Pathology:A.1'],
  courseRefs: [],
  links: [],
  origin: { type: 'ai-draft', ref: 'test' },
  updatedAt: 0,
  version: 1,
  year: 3,
  subject: 'General Pathology',
  vmleSubject: 'Veterinary Pathology',
  competencyId: 'Veterinary Pathology:A.1',
  stem: 'Which of the following best describes coagulative necrosis?',
  choices: [
    { key: 'A', text: 'Cell outline preserved' },
    { key: 'B', text: 'Liquefactive destruction' },
    { key: 'C', text: 'Cheesy friable material' },
    { key: 'D', text: 'Fat saponification' },
  ],
  answer: 'A',
  explanation: 'Coagulative necrosis preserves cell outline.',
  sourceType: 'ai-draft',
  source: 'test',
  status: 'unverified',
};

const baseFlashcard: FlashcardItem = {
  id: 'fc-test-001',
  type: 'card',
  competencyIds: ['Veterinary Pathology:A.1'],
  courseRefs: [],
  links: [],
  origin: { type: 'ai-draft', ref: 'test' },
  status: 'unverified',
  updatedAt: 0,
  version: 1,
  front: 'Coagulative necrosis',
  back: 'Cell outline preserved; nucleus dissolved',
};

describe('activityRegistry', () => {
  it('has mcq and flashcard registered after import', () => {
    expect(activityRegistry.get('mcq')).toBeDefined();
    expect(activityRegistry.get('flashcard')).toBeDefined();
  });

  it('types() includes both registered types', () => {
    expect(activityRegistry.types()).toContain('mcq');
    expect(activityRegistry.types()).toContain('flashcard');
  });

  it('returns undefined for unknown type', () => {
    expect(activityRegistry.get('diagram')).toBeUndefined();
  });
});

describe('mcqActivity.grade', () => {
  const START = Date.now() - 5000; // 5 seconds ago

  it('correct answer → correct:true', () => {
    const result = mcqActivity.grade(baseQuestion, 'A', START);
    expect(result.correct).toBe(true);
  });

  it('wrong answer → correct:false, rating 1', () => {
    const result = mcqActivity.grade(baseQuestion, 'B', START);
    expect(result.correct).toBe(false);
    expect(result.rating).toBe(1);
  });

  it('correct answer → rating 3 (default confidence 2, medium)', () => {
    const result = mcqActivity.grade(baseQuestion, 'A', START);
    expect(result.rating).toBe(3);
    expect(result.confidence).toBe(2);
  });

  it('responseMs is ≥ 0 and reflects elapsed time', () => {
    const result = mcqActivity.grade(baseQuestion, 'A', START);
    expect(result.responseMs).toBeGreaterThanOrEqual(0);
  });
});

describe('mcqActivity.toEvent', () => {
  it('produces a ReviewEvent with correct shape', () => {
    const result = mcqActivity.grade(baseQuestion, 'A', Date.now() - 3000);
    const event = mcqActivity.toEvent(baseQuestion, result, {
      sessionId: 'sess-1',
      mode: 'competency',
      ts: Date.now(),
    });
    expect(event.objectId).toBe('test-0001');
    expect(event.activityType).toBe('mcq');
    expect(event.sessionId).toBe('sess-1');
    expect(event.mode).toBe('competency');
    expect(event.id).toBeUndefined(); // not yet persisted
  });
});

describe('flashcardActivity.grade', () => {
  const START = Date.now() - 2000;

  it('known=true → correct:true, rating 4, confidence 3', () => {
    const result = flashcardActivity.grade(baseFlashcard, { known: true }, START);
    expect(result.correct).toBe(true);
    expect(result.rating).toBe(4);
    expect(result.confidence).toBe(3);
  });

  it('known=false → correct:false, rating 1, confidence 1', () => {
    const result = flashcardActivity.grade(baseFlashcard, { known: false }, START);
    expect(result.correct).toBe(false);
    expect(result.rating).toBe(1);
    expect(result.confidence).toBe(1);
  });

  it('responseMs ≥ 0', () => {
    const result = flashcardActivity.grade(baseFlashcard, { known: true }, START);
    expect(result.responseMs).toBeGreaterThanOrEqual(0);
  });
});

describe('flashcardActivity.toEvent', () => {
  it('produces a ReviewEvent with correct shape', () => {
    const result = flashcardActivity.grade(baseFlashcard, { known: true }, Date.now());
    const event = flashcardActivity.toEvent(baseFlashcard, result, {
      sessionId: 'sess-2',
      mode: 'bookmarked',
      ts: Date.now(),
    });
    expect(event.objectId).toBe('fc-test-001');
    expect(event.activityType).toBe('flashcard');
    expect(event.correct).toBe(true);
  });
});
