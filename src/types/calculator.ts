export interface CalculatorField {
  key: string;
  label: string;
  unit: string;
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number;
}

export interface CalculatorResult {
  key: string;
  label: string;
  unit: string;
  value: number;
  /** LaTeX-free formula string shown to user */
  formula: string;
}

export interface CalculatorDef {
  id: string;
  name: string;
  description: string;
  /** Textbook or guideline this is sourced from */
  source: string;
  /** Must be true before results are shown to user */
  verified: boolean;
  fields: CalculatorField[];
  compute(inputs: Record<string, number>): CalculatorResult[];
}
