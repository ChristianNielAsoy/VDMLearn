import { z } from 'zod';
import type { SchoolKey } from '@/types/curriculum';

export interface PreDvmSchoolRef {
  school: SchoolKey;
  courseCode: string;
}

export interface PreDvmTopic {
  id: string; // PRE:<CODE>:<SECTION>.<N>
  title: string;
  prerequisites: string[];
  openStaxRef: string | null;
  khanRef: string | null;
}

export interface PreDvmSection {
  id: string; // A, B, C, …
  title: string;
  topics: PreDvmTopic[];
}

export interface PreDvmCourse {
  code: string;
  title: string;
  year: 0;
  vmleSubject: null;
  source: string;
  schoolRefs: PreDvmSchoolRef[];
  sections: PreDvmSection[];
}

// ── Zod schema ───────────────────────────────────────────────────────────────

export const PreDvmTopicSchema = z.object({
  id: z.string().regex(/^PRE:[A-Z][A-Z0-9-]+:[A-Z]\.\d+$/, 'id must match PRE:<CODE>:<SEC>.<N>'),
  title: z.string().min(1),
  prerequisites: z.array(z.string()),
  openStaxRef: z.string().nullable(),
  khanRef: z.string().nullable(),
});

export const PreDvmSectionSchema = z.object({
  id: z.string().regex(/^[A-Z]$/, 'section id must be a single capital letter'),
  title: z.string().min(1),
  topics: z.array(PreDvmTopicSchema).min(1),
});

export const PreDvmCourseSchema = z.object({
  code: z.string().min(1),
  title: z.string().min(1),
  year: z.literal(0),
  vmleSubject: z.null(),
  source: z.string().min(1),
  schoolRefs: z.array(
    z.object({
      school: z.enum(['UPLB', 'CLSU', 'PSAU', 'CHED']),
      courseCode: z.string().min(1),
    }),
  ),
  sections: z.array(PreDvmSectionSchema).min(1),
});
