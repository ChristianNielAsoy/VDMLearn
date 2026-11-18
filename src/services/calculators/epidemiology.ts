import type { CalculatorDef } from '@/types/calculator';

/**
 * 2×2 contingency table: sensitivity, specificity, PPV, NPV, accuracy, LR+, LR-.
 * Source: Dohoo I, Martin W, Stryhn H. Methods in Observational Epidemiology, 2nd ed.
 *   (AVC, 2003); also Thrusfield MV. Veterinary Epidemiology, 4th ed. (Wiley, 2018).
 *
 * Table layout:
 *         Disease+  Disease-
 * Test+     TP        FP
 * Test-     FN        TN
 */
export const epi2x2Calc: CalculatorDef = {
  id: 'epi-2x2',
  name: 'Diagnostic Test (2×2 table)',
  description:
    'Enter TP, FP, FN, TN counts to compute sensitivity, specificity, PPV, NPV, accuracy, and likelihood ratios.',
  source: 'Thrusfield MV. Veterinary Epidemiology, 4th ed. (Wiley, 2018), Ch. 18',
  verified: true,
  fields: [
    {
      key: 'tp',
      label: 'True Positives (TP)',
      unit: 'n',
      min: 0,
      max: 1e6,
      step: 1,
      defaultValue: 90,
    },
    {
      key: 'fp',
      label: 'False Positives (FP)',
      unit: 'n',
      min: 0,
      max: 1e6,
      step: 1,
      defaultValue: 10,
    },
    {
      key: 'fn',
      label: 'False Negatives (FN)',
      unit: 'n',
      min: 0,
      max: 1e6,
      step: 1,
      defaultValue: 20,
    },
    {
      key: 'tn',
      label: 'True Negatives (TN)',
      unit: 'n',
      min: 0,
      max: 1e6,
      step: 1,
      defaultValue: 80,
    },
  ],
  compute(inputs) {
    const tp = inputs['tp']!;
    const fp = inputs['fp']!;
    const fn = inputs['fn']!;
    const tn = inputs['tn']!;
    const diseasePos = tp + fn;
    const diseaseNeg = fp + tn;
    const testPos = tp + fp;
    const total = tp + fp + fn + tn;

    const sens = diseasePos > 0 ? tp / diseasePos : 0;
    const spec = diseaseNeg > 0 ? tn / diseaseNeg : 0;
    const ppv = testPos > 0 ? tp / testPos : 0;
    const npv = fn + tn > 0 ? tn / (fn + tn) : 0;
    const acc = total > 0 ? (tp + tn) / total : 0;
    const lrPos = spec < 1 ? sens / (1 - spec) : Infinity;
    const lrNeg = sens > 0 ? (1 - sens) / spec : 0;

    return [
      {
        key: 'sens',
        label: 'Sensitivity (Se)',
        unit: '%',
        value: pct(sens),
        formula: 'TP / (TP + FN)',
      },
      {
        key: 'spec',
        label: 'Specificity (Sp)',
        unit: '%',
        value: pct(spec),
        formula: 'TN / (TN + FP)',
      },
      { key: 'ppv', label: 'PPV', unit: '%', value: pct(ppv), formula: 'TP / (TP + FP)' },
      { key: 'npv', label: 'NPV', unit: '%', value: pct(npv), formula: 'TN / (TN + FN)' },
      { key: 'acc', label: 'Accuracy', unit: '%', value: pct(acc), formula: '(TP + TN) / total' },
      { key: 'lrPos', label: 'LR+', unit: '', value: round(lrPos, 2), formula: 'Se / (1 − Sp)' },
      { key: 'lrNeg', label: 'LR−', unit: '', value: round(lrNeg, 2), formula: '(1 − Se) / Sp' },
    ];
  },
};

/**
 * Odds ratio and relative risk from a 2×2 exposure/outcome table.
 *         Outcome+  Outcome-
 * Exposed    a         b
 * Unexposed  c         d
 */
export const epiOddsCalc: CalculatorDef = {
  id: 'epi-odds',
  name: 'Odds Ratio & Relative Risk',
  description: 'Compute OR and RR from a 2×2 exposure–outcome table.',
  source:
    'Dohoo I, Martin W, Stryhn H. Methods in Observational Epidemiology, 2nd ed. (AVC, 2003), Ch. 4',
  verified: true,
  fields: [
    {
      key: 'a',
      label: 'Exposed & outcome+ (a)',
      unit: 'n',
      min: 0,
      max: 1e6,
      step: 1,
      defaultValue: 50,
    },
    {
      key: 'b',
      label: 'Exposed & outcome− (b)',
      unit: 'n',
      min: 0,
      max: 1e6,
      step: 1,
      defaultValue: 50,
    },
    {
      key: 'c',
      label: 'Unexposed & outcome+ (c)',
      unit: 'n',
      min: 0,
      max: 1e6,
      step: 1,
      defaultValue: 20,
    },
    {
      key: 'd',
      label: 'Unexposed & outcome− (d)',
      unit: 'n',
      min: 0,
      max: 1e6,
      step: 1,
      defaultValue: 80,
    },
  ],
  compute(inputs) {
    const a = inputs['a']!;
    const b = inputs['b']!;
    const c = inputs['c']!;
    const d = inputs['d']!;
    const or = b * c > 0 ? (a * d) / (b * c) : Infinity;
    const riskExposed = a + b > 0 ? a / (a + b) : 0;
    const riskUnexposed = c + d > 0 ? c / (c + d) : 0;
    const rr = riskUnexposed > 0 ? riskExposed / riskUnexposed : Infinity;
    const prevTotal = a + b + c + d > 0 ? (a + c) / (a + b + c + d) : 0;
    return [
      {
        key: 'riskExp',
        label: 'Risk (exposed)',
        unit: '%',
        value: pct(riskExposed),
        formula: 'a / (a + b)',
      },
      {
        key: 'riskUnexp',
        label: 'Risk (unexposed)',
        unit: '%',
        value: pct(riskUnexposed),
        formula: 'c / (c + d)',
      },
      {
        key: 'rr',
        label: 'Relative Risk (RR)',
        unit: '',
        value: round(rr, 3),
        formula: 'risk exposed / risk unexposed',
      },
      {
        key: 'or',
        label: 'Odds Ratio (OR)',
        unit: '',
        value: round(or, 3),
        formula: '(a × d) / (b × c)',
      },
      {
        key: 'prev',
        label: 'Overall prevalence',
        unit: '%',
        value: pct(prevTotal),
        formula: '(a + c) / total',
      },
    ];
  },
};

function pct(val: number): number {
  return round(val * 100, 2);
}

function round(n: number, decimals: number): number {
  if (!isFinite(n)) return n;
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}
