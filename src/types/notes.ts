export type MistakeReason = 'knowledge-gap' | 'misread' | 'careless' | 'mixed-up';

export interface MistakeEntry {
  id?: number; // Dexie auto-increment PK
  questionId: string;
  reviewEventId?: number; // FK to ReviewEvent.id; absent when written before DB flush
  reason: MistakeReason;
  detail?: string; // max 200 chars
  ts: number;
}

export interface CompetencyNote {
  competencyId: string; // PK — one note per competency
  bodyMd: string; // raw user Markdown; [[CompetencyNode.id]] for wiki links
  updatedAt: number;
}

export interface ClozeCard {
  id?: number;
  competencyId: string;
  front: string; // cloze prompt with _____ blank
  back: string; // full sentence
  source: 'note-highlight' | 'manual';
  createdAt: number;
}

export interface BlurtSession {
  id?: number;
  competencyId: string;
  selfScore: 1 | 2 | 3;
  ts: number;
}
