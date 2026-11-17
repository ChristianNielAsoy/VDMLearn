import type { CalculatorDef } from '@/types/calculator';

/**
 * Pearson square for two-ingredient feed mixing.
 * Given ingredient A% protein, ingredient B% protein, and target% protein:
 *   parts of A = target - B% (take absolute)
 *   parts of B = A% - target (take absolute)
 * Source: Nutrient Requirements of Domestic Animals, NRC; also Cullison AE,
 *   Feeds and Feeding (Reston Pub, 1979), Ch. 4 — Balancing Rations.
 */
export const pearsonSquareCalc: CalculatorDef = {
  id: 'pearson-square',
  name: 'Pearson Square (2-ingredient mix)',
  description: 'Balance a two-ingredient feed to reach a target nutrient percentage (commonly crude protein). Valid when target is between the two ingredient values.',
  source: 'Cullison AE. Feeds and Feeding (Reston, 1979), Ch. 4; NRC Feed Composition Tables',
  verified: true,
  fields: [
    { key: 'aPercent', label: 'Ingredient A nutrient %', unit: '%', min: 0, max: 100, step: 0.1, defaultValue: 44 },
    { key: 'bPercent', label: 'Ingredient B nutrient %', unit: '%', min: 0, max: 100, step: 0.1, defaultValue: 8 },
    { key: 'target',   label: 'Target nutrient %',       unit: '%', min: 0, max: 100, step: 0.1, defaultValue: 16 },
    { key: 'totalKg',  label: 'Total batch size',         unit: 'kg', min: 1, max: 10000, step: 1, defaultValue: 100 },
  ],
  compute(inputs) {
    const aPercent = inputs['aPercent']!;
    const bPercent = inputs['bPercent']!;
    const target = inputs['target']!;
    const totalKg = inputs['totalKg']!;
    const partsA = Math.abs(target - bPercent);
    const partsB = Math.abs(aPercent - target);
    const totalParts = partsA + partsB;
    if (totalParts === 0) {
      return [{ key: 'error', label: 'Error', unit: '', value: 0, formula: 'Ingredient A% and B% cannot be equal' }];
    }
    const kgA = (partsA / totalParts) * totalKg;
    const kgB = (partsB / totalParts) * totalKg;
    return [
      { key: 'partsA', label: 'Parts of ingredient A', unit: 'parts', value: round(partsA, 2), formula: '|target − B%|' },
      { key: 'partsB', label: 'Parts of ingredient B', unit: 'parts', value: round(partsB, 2), formula: '|A% − target|' },
      { key: 'kgA',    label: 'Ingredient A in batch', unit: 'kg',    value: round(kgA, 2),    formula: '(parts A / total parts) × batch size' },
      { key: 'kgB',    label: 'Ingredient B in batch', unit: 'kg',    value: round(kgB, 2),    formula: '(parts B / total parts) × batch size' },
    ];
  },
};

function round(n: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}
