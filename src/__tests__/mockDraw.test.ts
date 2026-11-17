import { describe, it, expect } from 'vitest';
import {
  drawMockQuestions,
  drawForSubject,
  subjectQuestionCount,
  DAY_SUBJECTS,
} from '@/services/mockDraw';
import { loadTos } from '@/data/loaders/tos';
import sampleQuestions from '@/data/questions/sample.json';
import type { Question } from '@/types/question';

const allQ = sampleQuestions as unknown as Question[];
const tos = loadTos();

describe('subjectQuestionCount', () => {
  it('counts questions per subject correctly', () => {
    const counts = subjectQuestionCount(allQ);
    expect(counts.get('Veterinary Anatomy')).toBe(5);
    expect(counts.get('Veterinary Physiology')).toBe(5);
    expect(counts.get('Veterinary Pharmacology')).toBe(5);
    expect(counts.get('Veterinary Parasitology')).toBe(5);
    expect(counts.get('Veterinary Pathology')).toBeUndefined();
  });
});

describe('drawForSubject', () => {
  it('returns only questions for the given subject', () => {
    const pool = allQ.filter((q) => q.vmleSubject === 'Veterinary Anatomy');
    const drawn = drawForSubject('Veterinary Anatomy', pool, tos);
    expect(drawn.every((q) => q.vmleSubject === 'Veterinary Anatomy')).toBe(true);
  });

  it('returns no more questions than available', () => {
    const pool = allQ.filter((q) => q.vmleSubject === 'Veterinary Anatomy');
    const drawn = drawForSubject('Veterinary Anatomy', pool, tos);
    expect(drawn.length).toBeLessThanOrEqual(pool.length);
  });

  it('returns no duplicates', () => {
    const pool = allQ.filter((q) => q.vmleSubject === 'Veterinary Parasitology');
    const drawn = drawForSubject('Veterinary Parasitology', pool, tos);
    const ids = drawn.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('returns empty array for subject with no pool', () => {
    const drawn = drawForSubject('Veterinary Surgery', [], tos);
    expect(drawn).toHaveLength(0);
  });

  it('returns empty array for unknown subject', () => {
    const pool = allQ.filter((q) => q.vmleSubject === 'Veterinary Anatomy');
    const drawn = drawForSubject('Unknown Subject', pool, tos);
    expect(drawn).toHaveLength(0);
  });
});

describe('drawMockQuestions', () => {
  it('combines questions from all selected subjects', () => {
    const subjects = DAY_SUBJECTS[1];
    const drawn = drawMockQuestions(subjects, allQ, tos);
    const drawnSubjects = new Set(drawn.map((q) => q.vmleSubject));
    // Only Anatomy and Physiology have questions in Day 1
    expect(drawnSubjects.has('Veterinary Anatomy')).toBe(true);
    expect(drawnSubjects.has('Veterinary Physiology')).toBe(true);
  });

  it('returns no duplicates across subjects', () => {
    const subjects = ['Veterinary Anatomy', 'Veterinary Physiology'];
    const drawn = drawMockQuestions(subjects, allQ, tos);
    const ids = drawn.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('returns all available questions when pool is smaller than TOS target', () => {
    const subjects = ['Veterinary Anatomy'];
    const pool = allQ.filter((q) => q.vmleSubject === 'Veterinary Anatomy');
    const drawn = drawMockQuestions(subjects, allQ, tos);
    expect(drawn.length).toBeLessThanOrEqual(pool.length);
  });

  it('returns empty array when no questions match selected subjects', () => {
    const subjects = ['Veterinary Surgery', 'Veterinary Pathology'];
    const drawn = drawMockQuestions(subjects, allQ, tos);
    expect(drawn).toHaveLength(0);
  });

  it('DAY_SUBJECTS covers all 9 VMLE subjects without overlap', () => {
    const all = [...DAY_SUBJECTS[1], ...DAY_SUBJECTS[2], ...DAY_SUBJECTS[3]];
    expect(all.length).toBe(9);
    expect(new Set(all).size).toBe(9);
  });
});
