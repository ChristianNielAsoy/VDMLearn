import type { CalculatorDef } from '@/types/calculator';

/**
 * Basic fluid therapy volume estimate.
 * Deficit (mL) = body weight (kg) × dehydration (%) × 10
 * Maintenance (mL/day) = body weight (kg) × maintenance rate (mL/kg/day)
 * Source: Fluid Therapy in Small Animals, Dibartola SP (ed.), 3rd ed., Ch. 1.
 *   Maintenance ~ 50–66 mL/kg/day for dogs; default field is 60.
 */
export const fluidTherapyCalc: CalculatorDef = {
  id: 'fluid-therapy',
  name: 'Fluid Therapy Volume',
  description:
    'Estimate rehydration deficit and 24-hour maintenance fluid volume. Study-use only — always confirm with clinical judgement.',
  source: 'DiBartola SP. Fluid Therapy in Small Animals, 3rd ed., Ch. 1 (Elsevier, 2012)',
  verified: true,
  fields: [
    {
      key: 'weight',
      label: 'Body weight',
      unit: 'kg',
      min: 0.1,
      max: 1000,
      step: 0.1,
      defaultValue: 10,
    },
    {
      key: 'dehydration',
      label: 'Estimated dehydration',
      unit: '%',
      min: 0,
      max: 15,
      step: 0.5,
      defaultValue: 5,
    },
    {
      key: 'maintenance',
      label: 'Maintenance rate',
      unit: 'mL/kg/day',
      min: 1,
      max: 100,
      step: 1,
      defaultValue: 60,
    },
    {
      key: 'hours',
      label: 'Replacement period',
      unit: 'h',
      min: 1,
      max: 48,
      step: 1,
      defaultValue: 24,
    },
  ],
  compute(inputs) {
    const weight = inputs['weight']!;
    const dehydration = inputs['dehydration']!;
    const maintenance = inputs['maintenance']!;
    const hours = inputs['hours']!;
    const deficit = weight * dehydration * 10; // mL
    const maintenanceTotal = weight * maintenance; // mL/24h
    const maintenanceForPeriod = maintenanceTotal * (hours / 24);
    const total = deficit + maintenanceForPeriod;
    const ratePerHour = total / hours;
    return [
      {
        key: 'deficit',
        label: 'Rehydration deficit',
        unit: 'mL',
        value: round(deficit, 1),
        formula: 'deficit = weight × dehydration% × 10',
      },
      {
        key: 'maint',
        label: 'Maintenance (24 h)',
        unit: 'mL',
        value: round(maintenanceTotal, 1),
        formula: 'maintenance = weight × rate',
      },
      {
        key: 'total',
        label: `Total over ${hours} h`,
        unit: 'mL',
        value: round(total, 1),
        formula: 'total = deficit + maintenance for period',
      },
      {
        key: 'ratePerHour',
        label: 'Infusion rate',
        unit: 'mL/h',
        value: round(ratePerHour, 1),
        formula: 'rate = total ÷ hours',
      },
    ];
  },
};

function round(n: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}
