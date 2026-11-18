import type { ParametricTemplate, ParametricInstance } from '@/types/parametric';

export function generateInstance(template: ParametricTemplate, seed?: number): ParametricInstance {
  const vars: Record<string, number> = {};
  const rng = seed !== undefined ? mulberry32(seed) : () => Math.random();

  for (const v of template.variables) {
    const steps = Math.floor((v.max - v.min) / v.step);
    const pick = Math.floor(rng() * (steps + 1));
    const raw = v.min + pick * v.step;
    const f = 10 ** v.decimals;
    vars[v.key] = Math.round(raw * f) / f;
  }

  const answer = roundTo(template.computeAnswer(vars), 4);
  return { templateId: template.id, vars, answer };
}

export function checkAnswer(
  instance: ParametricInstance,
  template: ParametricTemplate,
  userAnswer: number,
): boolean {
  return Math.abs(userAnswer - instance.answer) <= template.tolerance;
}

export function renderStem(
  template: ParametricTemplate,
  vars: Record<string, number | string>,
): string {
  return interpolate(template.stem, vars);
}

export function renderExplanation(
  template: ParametricTemplate,
  vars: Record<string, number>,
  answer: number,
): string {
  return interpolate(template.explanationTemplate, { ...vars, answer });
}

function interpolate(text: string, values: Record<string, number | string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const v = values[key];
    return v !== undefined ? String(v) : `{{${key}}}`;
  });
}

function roundTo(n: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}

/** Deterministic pseudo-random number generator (mulberry32) */
function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s += 0x6d2b79f5;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
