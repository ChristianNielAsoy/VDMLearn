import type { CalculatorDef } from '@/types/calculator';

/**
 * Basic drug dose → volume calculator.
 * Volume (mL) = (Dose rate mg/kg × Body weight kg) / Drug concentration mg/mL
 * Source: Plumb's Veterinary Drug Handbook, 10th ed., Appendix — Dose Calculation.
 */
export const drugDoseCalc: CalculatorDef = {
  id: 'drug-dose',
  name: 'Drug Dose → Volume',
  description: 'Calculate the volume to draw up for an injectable drug given dose rate, patient weight, and drug concentration.',
  source: "Plumb's Veterinary Drug Handbook, 10th ed., Dose Calculation appendix",
  verified: true,
  fields: [
    { key: 'doseRate',      label: 'Dose rate',           unit: 'mg/kg',  min: 0,   max: 1000,  step: 0.01, defaultValue: 1 },
    { key: 'weight',        label: 'Patient body weight',  unit: 'kg',     min: 0.1, max: 1000,  step: 0.1,  defaultValue: 10 },
    { key: 'concentration', label: 'Drug concentration',   unit: 'mg/mL',  min: 0.1, max: 1000,  step: 0.1,  defaultValue: 10 },
  ],
  compute(inputs) {
    const doseRate = inputs['doseRate']!;
    const weight = inputs['weight']!;
    const concentration = inputs['concentration']!;
    const totalDose = doseRate * weight;
    const volume = totalDose / concentration;
    return [
      {
        key: 'totalDose',
        label: 'Total dose',
        unit: 'mg',
        value: round(totalDose, 3),
        formula: 'Total dose = dose rate × weight',
      },
      {
        key: 'volume',
        label: 'Volume to draw up',
        unit: 'mL',
        value: round(volume, 3),
        formula: 'Volume = total dose ÷ concentration',
      },
    ];
  },
};

function round(n: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}
