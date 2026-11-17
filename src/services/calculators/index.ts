import type { CalculatorDef } from '@/types/calculator';
import { drugDoseCalc } from './drugDose';
import { fluidTherapyCalc } from './fluidTherapy';
import { pearsonSquareCalc } from './pearsonSquare';
import { epi2x2Calc, epiOddsCalc } from './epidemiology';

export const ALL_CALCULATORS: CalculatorDef[] = [
  drugDoseCalc,
  fluidTherapyCalc,
  pearsonSquareCalc,
  epi2x2Calc,
  epiOddsCalc,
];

export function getCalculator(id: string): CalculatorDef | undefined {
  return ALL_CALCULATORS.find((c) => c.id === id);
}
