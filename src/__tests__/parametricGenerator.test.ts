import { describe, it, expect } from 'vitest';
import {
  generateInstance,
  checkAnswer,
  renderStem,
  renderExplanation,
} from '@/services/parametricGenerator';
import { PARAMETRIC_TEMPLATES } from '@/data/parametric/templates';
import type { ParametricTemplate } from '@/types/parametric';

function getTemplate(id: string): ParametricTemplate {
  const t = PARAMETRIC_TEMPLATES.find((t) => t.id === id);
  if (!t) throw new Error(`Template ${id} not found`);
  return t;
}

describe('generateInstance', () => {
  it('generates values within field bounds', () => {
    const t = getTemplate('pharm-dose-volume');
    const inst = generateInstance(t, 42);
    for (const field of t.variables) {
      const val = inst.vars[field.key]!;
      expect(val).toBeGreaterThanOrEqual(field.min);
      expect(val).toBeLessThanOrEqual(field.max);
    }
  });

  it('is deterministic with the same seed', () => {
    const t = getTemplate('pharm-dose-volume');
    const a = generateInstance(t, 100);
    const b = generateInstance(t, 100);
    expect(a.vars).toEqual(b.vars);
    expect(a.answer).toBe(b.answer);
  });

  it('varies with different seeds', () => {
    const t = getTemplate('pharm-dose-volume');
    const a = generateInstance(t, 1);
    const b = generateInstance(t, 2);
    // Not guaranteed to differ on every seed, but very likely
    const differs = JSON.stringify(a.vars) !== JSON.stringify(b.vars);
    expect(differs).toBe(true);
  });

  it('computes correct answer for drug dose', () => {
    const t = getTemplate('pharm-dose-volume');
    const inst = generateInstance(t, 7);
    const expected = t.computeAnswer(inst.vars);
    expect(inst.answer).toBe(expected);
  });
});

describe('checkAnswer', () => {
  it('accepts answer within tolerance', () => {
    const t = getTemplate('pharm-dose-volume');
    const inst = generateInstance(t, 5);
    expect(checkAnswer(inst, t, inst.answer)).toBe(true);
    expect(checkAnswer(inst, t, inst.answer + 0.009)).toBe(true);
  });

  it('rejects answer outside tolerance', () => {
    const t = getTemplate('pharm-dose-volume');
    const inst = generateInstance(t, 5);
    expect(checkAnswer(inst, t, inst.answer + 0.1)).toBe(false);
  });
});

describe('renderStem', () => {
  it('interpolates variables into stem', () => {
    const t = getTemplate('pharm-dose-volume');
    const vars = {
      weight: 10,
      doseRate: 2,
      concentration: 20,
      species: 'dog',
      drug: 'amoxicillin',
    };
    const rendered = renderStem(t, vars);
    expect(rendered).toContain('10');
    expect(rendered).toContain('2');
    expect(rendered).toContain('20');
  });

  it('leaves unresolved keys visible', () => {
    const t = getTemplate('pharm-dose-volume');
    const rendered = renderStem(t, { weight: 5 });
    expect(rendered).toContain('{{doseRate}}');
  });
});

describe('renderExplanation', () => {
  it('interpolates vars and answer', () => {
    const t = getTemplate('pharm-dose-volume');
    const vars = { weight: 10, doseRate: 2, concentration: 20 };
    const rendered = renderExplanation(t, vars, 1);
    expect(rendered).toContain('1');
  });
});

describe('template correctness', () => {
  it('pearson square template gives correct answer', () => {
    const t = getTemplate('zoo-feed-mix');
    // aPercent=44, bPercent=8, target=16 → parts A=8, parts B=28, %A = 8/36 ≈ 22.22%
    const answer = t.computeAnswer({ aPercent: 44, bPercent: 8, target: 16 });
    expect(answer).toBeCloseTo(22.22, 1);
  });

  it('sensitivity template gives correct answer', () => {
    const t = getTemplate('epi-sensitivity');
    // tp=90, fn_add=10 → 90/(90+10) = 90%
    const answer = t.computeAnswer({ tp: 90, fn_add: 10 });
    expect(answer).toBe(90);
  });
});
