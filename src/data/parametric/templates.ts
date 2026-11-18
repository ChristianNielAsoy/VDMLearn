import type { ParametricTemplate } from '@/types/parametric';

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

export const PARAMETRIC_TEMPLATES: ParametricTemplate[] = [
  {
    id: 'pharm-dose-volume',
    competencyId: 'Veterinary Pharmacology:A.3',
    stem: 'A {{species}} weighing {{weight}} kg requires {{drug}} at a dose of {{doseRate}} mg/kg. The available formulation is {{concentration}} mg/mL. How many mL should be drawn up?',
    variables: [
      { key: 'weight', label: 'Body weight', unit: 'kg', min: 2, max: 50, step: 1, decimals: 0 },
      {
        key: 'doseRate',
        label: 'Dose rate',
        unit: 'mg/kg',
        min: 0.5,
        max: 10,
        step: 0.5,
        decimals: 1,
      },
      {
        key: 'concentration',
        label: 'Concentration',
        unit: 'mg/mL',
        min: 5,
        max: 100,
        step: 5,
        decimals: 0,
      },
    ],
    computeAnswer(vars) {
      return round3((vars['doseRate']! * vars['weight']!) / vars['concentration']!);
    },
    answerUnit: 'mL',
    tolerance: 0.01,
    explanationTemplate:
      'Total dose = {{doseRate}} mg/kg × {{weight}} kg = {{totalDose}} mg. Volume = {{totalDose}} mg ÷ {{concentration}} mg/mL = {{answer}} mL.',
    source: "Plumb's Veterinary Drug Handbook, 10th ed.",
    verified: true,
  },
  {
    id: 'pharm-infusion-rate',
    competencyId: 'Veterinary Pharmacology:A.3',
    stem: 'You need to administer {{totalDose}} mg of a drug over {{hours}} hours. The IV bag contains {{bagConc}} mg/mL. What is the infusion rate in mL/h?',
    variables: [
      {
        key: 'totalDose',
        label: 'Total dose',
        unit: 'mg',
        min: 100,
        max: 1000,
        step: 50,
        decimals: 0,
      },
      { key: 'hours', label: 'Duration', unit: 'h', min: 1, max: 24, step: 1, decimals: 0 },
      {
        key: 'bagConc',
        label: 'Bag concentration',
        unit: 'mg/mL',
        min: 1,
        max: 20,
        step: 1,
        decimals: 0,
      },
    ],
    computeAnswer(vars) {
      return round3(vars['totalDose']! / vars['bagConc']! / vars['hours']!);
    },
    answerUnit: 'mL/h',
    tolerance: 0.05,
    explanationTemplate:
      'Volume of drug = {{totalDose}} mg ÷ {{bagConc}} mg/mL = {{volDrug}} mL. Rate = {{volDrug}} mL ÷ {{hours}} h = {{answer}} mL/h.',
    source: "Plumb's Veterinary Drug Handbook, 10th ed.",
    verified: true,
  },
  {
    id: 'epi-sensitivity',
    competencyId: 'Veterinary Microbiology and Public Health:G',
    stem: 'A diagnostic test is evaluated on {{total}} animals. Among {{diseased}} truly infected animals, {{tp}} tested positive. Among {{healthy}} disease-free animals, {{tn}} tested negative. What is the sensitivity of the test?',
    variables: [
      { key: 'tp', label: 'True positives', unit: '', min: 50, max: 90, step: 5, decimals: 0 },
      { key: 'fn_add', label: 'False neg add', unit: '', min: 5, max: 20, step: 5, decimals: 0 },
    ],
    computeAnswer(vars) {
      const tp = vars['tp']!;
      const fn = vars['fn_add']!;
      return round3((tp / (tp + fn)) * 100);
    },
    answerUnit: '%',
    tolerance: 0.5,
    explanationTemplate:
      'Sensitivity = TP / (TP + FN) = {{tp}} / ({{tp}} + {{fn_add}}) × 100 = {{answer}}%.',
    source: 'Thrusfield MV. Veterinary Epidemiology, 4th ed. (Wiley, 2018)',
    verified: true,
  },
  {
    id: 'zoo-feed-mix',
    competencyId: 'Zootechnics:B.3',
    stem: 'You are mixing feed for a group of animals using ingredient A ({{aPercent}}% crude protein) and ingredient B ({{bPercent}}% crude protein). The target crude protein is {{target}}%. What percentage of the mix should be ingredient A?',
    variables: [
      {
        key: 'aPercent',
        label: 'Ingredient A CP',
        unit: '%',
        min: 30,
        max: 50,
        step: 2,
        decimals: 0,
      },
      {
        key: 'bPercent',
        label: 'Ingredient B CP',
        unit: '%',
        min: 6,
        max: 12,
        step: 2,
        decimals: 0,
      },
      { key: 'target', label: 'Target CP', unit: '%', min: 14, max: 22, step: 2, decimals: 0 },
    ],
    computeAnswer(vars) {
      const partsA = Math.abs(vars['target']! - vars['bPercent']!);
      const partsB = Math.abs(vars['aPercent']! - vars['target']!);
      return round3((partsA / (partsA + partsB)) * 100);
    },
    answerUnit: '%',
    tolerance: 0.5,
    explanationTemplate:
      'Parts A = |target − B%| = |{{target}} − {{bPercent}}| = {{partsA}}. Parts B = |A% − target| = |{{aPercent}} − {{target}}| = {{partsB}}. % A = partsA / (partsA + partsB) × 100 = {{answer}}%.',
    source: 'Cullison AE. Feeds and Feeding (Reston, 1979), Ch. 4',
    verified: true,
  },
];

export function getTemplatesForCompetency(competencyId: string): ParametricTemplate[] {
  return PARAMETRIC_TEMPLATES.filter((t) => t.competencyId === competencyId);
}
