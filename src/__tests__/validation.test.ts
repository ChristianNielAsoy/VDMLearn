import { describe, test, expect } from 'vitest';
import { loadTos, getCompetencyById } from '@/data/loaders/tos';
import type { Question } from '@/types/question';
import sampleRaw from '@/data/questions/sample.json';

const questions = sampleRaw as unknown as Question[];

describe('TOS data validation', () => {
  test('loadTos() does not throw on real data', () => {
    expect(() => loadTos()).not.toThrow();
  });

  test('exam weights sum to 100', () => {
    const tos = loadTos();
    const total = tos.subjects.reduce((s, sub) => s + sub.examWeightPct, 0);
    expect(total).toBe(100);
  });

  test('there are exactly 9 VMLE subjects', () => {
    const tos = loadTos();
    expect(tos.subjects).toHaveLength(9);
  });

  test('every subject has leaf items summing to itemsPerExam (100)', () => {
    const tos = loadTos();
    for (const subject of tos.subjects) {
      let leafSum = 0;
      for (const section of subject.sections) {
        for (const topic of section.topics) {
          if (!topic.sub || topic.sub.length === 0) {
            leafSum += topic.items;
          } else {
            leafSum += topic.sub.reduce((s, sub) => s + sub.items, 0);
          }
        }
      }
      expect(leafSum, `${subject.name} leaf sum`).toBe(subject.itemsPerExam);
    }
  });

  test('getCompetencyById finds a known sub-competency (Veterinary Anatomy:A.1.1)', () => {
    const tos = loadTos();
    const result = getCompetencyById(tos, 'Veterinary Anatomy:A.1.1');
    expect(result).not.toBeNull();
    expect(result?.subject).toBe('Veterinary Anatomy');
    expect(result?.sectionId).toBe('A');
    expect(result?.items).toBe(1);
  });

  test('getCompetencyById finds a top-level topic without subs (Veterinary Physiology:A.7)', () => {
    const tos = loadTos();
    const result = getCompetencyById(tos, 'Veterinary Physiology:A.7');
    expect(result).not.toBeNull();
    expect(result?.subject).toBe('Veterinary Physiology');
    expect(result?.items).toBe(4);
  });

  test('getCompetencyById returns null for unknown competency', () => {
    const tos = loadTos();
    expect(getCompetencyById(tos, 'Veterinary Anatomy:Z.99.99')).toBeNull();
  });

  test('getCompetencyById returns null for malformed ID (no colon)', () => {
    const tos = loadTos();
    expect(getCompetencyById(tos, 'invalid-no-colon')).toBeNull();
  });

  test('all 20 sample questions reference valid competency IDs', () => {
    const tos = loadTos();
    for (const q of questions) {
      const result = getCompetencyById(tos, q.competencyId);
      expect(
        result,
        `question "${q.id}" has invalid competencyId "${q.competencyId}"`,
      ).not.toBeNull();
    }
  });

  test('all 20 sample questions are marked unverified with source "ai-draft"', () => {
    for (const q of questions) {
      expect(q.status, `${q.id} status`).toBe('unverified');
      expect(q.sourceType, `${q.id} sourceType`).toBe('ai-draft');
      expect(q.source, `${q.id} source`).toBeTruthy();
    }
  });
});
