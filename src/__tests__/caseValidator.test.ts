import { describe, it, expect } from 'vitest';
import { validateCase } from '@/services/caseValidator';
import type { CaseDef } from '@/types/case';
import { CASES } from '@/data/cases/index';

const minimalCase: CaseDef = {
  id: 'test-case',
  title: 'Test Case',
  species: 'Canine',
  description: 'A test case',
  competencyIds: [],
  source: 'Test',
  verified: false,
  startNodeId: 'n1',
  maxScore: 10,
  nodes: [
    {
      id: 'n1',
      kind: 'signalment',
      content: 'Signalment content',
      next: 'n2',
    },
    {
      id: 'n2',
      kind: 'decision',
      content: 'Make a decision',
      choices: [
        { id: 'c1', label: 'Option A', next: 'n3', correct: true, points: 10, feedback: 'Correct!' },
        { id: 'c2', label: 'Option B', next: 'n4', correct: false, points: 0, feedback: 'Incorrect.' },
      ],
    },
    {
      id: 'n3',
      kind: 'outcome',
      content: 'Good outcome',
      finalDiagnosis: 'Disease A',
    },
    {
      id: 'n4',
      kind: 'outcome',
      content: 'Poor outcome',
      finalDiagnosis: 'Missed diagnosis',
    },
  ],
};

describe('validateCase', () => {
  it('passes a valid minimal case', () => {
    const result = validateCase(minimalCase);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('fails when id is missing', () => {
    const c = { ...minimalCase, id: '' };
    const result = validateCase(c);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'MISSING_ID')).toBe(true);
  });

  it('fails when startNodeId does not exist', () => {
    const c = { ...minimalCase, startNodeId: 'nonexistent' };
    const result = validateCase(c);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'BAD_START')).toBe(true);
  });

  it('fails when a decision node has only 1 choice', () => {
    const c: CaseDef = {
      ...minimalCase,
      nodes: [
        { ...minimalCase.nodes[0]! },
        {
          id: 'n2',
          kind: 'decision',
          content: 'Decision',
          choices: [
            { id: 'c1', label: 'Only option', next: 'n3', correct: true, points: 10, feedback: 'Ok' },
          ],
        },
        { ...minimalCase.nodes[2]! },
        { ...minimalCase.nodes[3]! },
      ],
    };
    const result = validateCase(c);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'DECISION_FEW_CHOICES')).toBe(true);
  });

  it('fails when a choice points to a nonexistent node', () => {
    const c: CaseDef = {
      ...minimalCase,
      nodes: [
        minimalCase.nodes[0]!,
        {
          id: 'n2',
          kind: 'decision',
          content: 'Decision',
          choices: [
            { id: 'c1', label: 'A', next: 'n3', correct: true, points: 10, feedback: 'Good' },
            { id: 'c2', label: 'B', next: 'missing', correct: false, points: 0, feedback: 'Bad' },
          ],
        },
        minimalCase.nodes[2]!,
        minimalCase.nodes[3]!,
      ],
    };
    const result = validateCase(c);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'CHOICE_BAD_NEXT')).toBe(true);
  });

  it('fails when a non-decision node has no next', () => {
    const c: CaseDef = {
      ...minimalCase,
      nodes: [
        { id: 'n1', kind: 'signalment', content: 'Text' }, // no next
        minimalCase.nodes[1]!,
        minimalCase.nodes[2]!,
        minimalCase.nodes[3]!,
      ],
    };
    const result = validateCase(c);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'NODE_MISSING_NEXT')).toBe(true);
  });

  it('warns about unreachable nodes', () => {
    const c: CaseDef = {
      ...minimalCase,
      nodes: [
        ...minimalCase.nodes,
        { id: 'orphan', kind: 'outcome', content: 'Unreachable', finalDiagnosis: 'X' },
      ],
    };
    const result = validateCase(c);
    expect(result.valid).toBe(true); // warnings only, not errors
    expect(result.warnings.some((w) => w.includes('orphan'))).toBe(true);
  });

  it('warns when maxScore does not match computed max', () => {
    const c = { ...minimalCase, maxScore: 999 };
    const result = validateCase(c);
    expect(result.warnings.some((w) => w.includes('maxScore'))).toBe(true);
  });

  it('validates all built-in cases without errors', () => {
    for (const c of CASES) {
      const result = validateCase(c);
      expect(result.errors, `${c.id} should have no errors`).toHaveLength(0);
    }
  });
});
