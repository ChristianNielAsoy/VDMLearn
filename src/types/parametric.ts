export interface ParametricVariable {
  key: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  decimals: number;
}

export interface ParametricTemplate {
  id: string;
  competencyId: string;
  stem: string;
  /** References to variable keys: use {{key}} in stem */
  variables: ParametricVariable[];
  /** Pure function: given variable values, return the numeric answer */
  computeAnswer(vars: Record<string, number>): number;
  answerUnit: string;
  /** Acceptable tolerance as an absolute value */
  tolerance: number;
  /** Explanation template referencing {{key}} and {{answer}} */
  explanationTemplate: string;
  source: string;
  verified: boolean;
}

export interface ParametricInstance {
  templateId: string;
  vars: Record<string, number>;
  answer: number;
}
