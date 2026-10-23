import type { SchoolKey } from '@/types/curriculum';

export type LearningObjectType =
  | 'question'
  | 'lesson'
  | 'card'
  | 'diagram'
  | 'case'
  | 'note'
  | 'drugCard'
  | 'checklist'
  | 'resource';

export interface CourseRef {
  school: SchoolKey;
  year: number;
  semester: number;
  courseName: string;
}

export interface OriginInfo {
  type:
    | 'own-notes'
    | 'ai-draft'
    | 'open-reference'
    | 'hand-written'
    | 'content-pack'
    | 'imported';
  ref: string; // textbook+page, URL, or descriptive reference
}

/**
 * Base type for all reviewable learning objects.
 * All 1.0 types (Question, Lesson) are structurally compatible with this.
 * New fields are synthesized by loaders for existing DB rows until the
 * Dexie v8 upgrade (C5) populates them on all stored rows.
 */
export interface LearningObject {
  id: string;
  type: LearningObjectType;
  competencyIds: string[]; // PRC Annex A ids, e.g. ["Veterinary Anatomy:A.1.1"]
  courseRefs: CourseRef[]; // curriculum cross-refs (empty array = not tagged to a course)
  links: string[]; // ids of related learning objects
  origin: OriginInfo; // replaces sourceType+source conceptually; both kept on Question for compat
  status: 'unverified' | 'verified' | 'flagged';
  updatedAt: number; // unix ms; 0 = synthesized/never explicitly updated
  version: number; // 1-based; incremented by content pack updates
  packId?: string; // which content pack installed this row
  notes?: string;
}
