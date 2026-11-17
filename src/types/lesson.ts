import type { VmleSubject } from '@/types/question';

export type LessonStatus = 'unread' | 'read' | 'reviewed';

export interface Lesson {
  id: string;
  year: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  subject: string;
  topic: string;
  vmleSubject: VmleSubject;
  objectives: string[];
  overview: string;
  keyTerms: { term: string; definition: string }[];
  content: string;
  highYield: string;
  mnemonics?: string;
  checkQuestions: string[];
  diagrams?: { title: string; mermaid: string }[];
}

export interface UserLessonStatus {
  lessonId: string;
  status: LessonStatus;
  updatedAt: number;
}

export interface LessonNote {
  lessonId: string;
  bodyMd: string;
  updatedAt: number;
}
