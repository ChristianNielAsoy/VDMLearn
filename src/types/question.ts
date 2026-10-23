import type { CourseRef, OriginInfo } from '@/types/learningObject';

export type VmleSubject =
  | 'Veterinary Anatomy'
  | 'Veterinary Physiology'
  | 'Zootechnics'
  | 'Veterinary Pathology'
  | 'Veterinary Pharmacology'
  | 'Veterinary Medicine'
  | 'Veterinary Microbiology and Public Health'
  | 'Veterinary Parasitology'
  | 'Veterinary Surgery';

export const VMLE_SUBJECTS: VmleSubject[] = [
  'Veterinary Anatomy',
  'Veterinary Physiology',
  'Zootechnics',
  'Veterinary Pathology',
  'Veterinary Pharmacology',
  'Veterinary Medicine',
  'Veterinary Microbiology and Public Health',
  'Veterinary Parasitology',
  'Veterinary Surgery',
];

export type ChoiceKey = 'A' | 'B' | 'C' | 'D';
export type QuestionStatus = 'unverified' | 'verified' | 'flagged';
export type SourceType = 'own-notes' | 'ai-draft' | 'open-reference' | 'hand-written';
export type School = 'UPLB' | 'CLSU' | 'PSAU' | 'CHED';

export interface Question {
  // ── LearningObject base fields (M1) ──────────────────────────────────
  // New fields are synthesized by loaders; existing DB rows get them in the
  // Dexie v8 upgrade (C5). Until then they default to safe empty values.
  type: 'question';
  competencyIds: string[]; // synthesized as [competencyId] by loader
  courseRefs: CourseRef[]; // curriculum cross-refs; [] until user tags
  links: string[]; // related LO ids; [] initially
  origin: OriginInfo; // synthesized from sourceType+source by loader
  updatedAt: number; // 0 = never explicitly updated by user
  version: number; // 1 for seed/imported; incremented by pack updates
  packId?: string;

  // ── Existing fields (unchanged) ───────────────────────────────────────
  id: string;
  year: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  school?: School;
  courseCode?: string;
  subject: string;
  vmleSubject: VmleSubject;
  competencyId: string; // kept for backward compat; competencyIds[0] === competencyId
  stem: string;
  choices: { key: ChoiceKey; text: string }[];
  answer: ChoiceKey;
  explanation: string;
  sourceType: SourceType; // kept for backward compat; mirrors origin.type
  source: string; // kept for backward compat; mirrors origin.ref
  status: QuestionStatus;
  notes?: string;
  approvals?: { userId: string; source: string; at: number }[];
}

export interface Attempt {
  id?: number;
  questionId: string;
  chosen: ChoiceKey;
  correct: boolean;
  timestamp: number;
}

export function isCorrect(chosen: ChoiceKey, answer: ChoiceKey): boolean {
  return chosen === answer;
}
