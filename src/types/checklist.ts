export interface ChecklistStep {
  id: string;
  text: string;
  note?: string;
}

export interface ChecklistDef {
  id: string;
  name: string;
  competencyId?: string;
  description: string;
  source: string;
  steps: ChecklistStep[];
}

export interface ChecklistProgress {
  checklistId: string;
  stepsDone: string[]; // step ids completed
  selfRating: 0 | 1 | 2 | 3; // 0=not rated, 1=needs work, 2=ok, 3=competent
  lastPracticedAt: number;
}
