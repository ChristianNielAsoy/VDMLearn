import { z } from 'zod';
import type { Question, VmleSubject } from '@/types/question';
import { VMLE_SUBJECTS } from '@/types/question';
import { hydrateLearningObjectFields } from '@/data/loaders/questions';

const ChoiceKeySchema = z.enum(['A', 'B', 'C', 'D']);
const SourceTypeSchema = z.enum(['own-notes', 'ai-draft', 'open-reference', 'hand-written']);
const SchoolSchema = z.enum(['UPLB', 'CLSU', 'PSAU', 'CHED']);
const StatusSchema = z.enum(['unverified', 'verified', 'flagged']);
const YearSchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
]);

const VmleSubjectSchema = z
  .string()
  .refine((v): v is VmleSubject => (VMLE_SUBJECTS as string[]).includes(v), {
    message: `vmleSubject must be one of: ${VMLE_SUBJECTS.join(', ')}`,
  });

const OriginTypeSchema = z.enum([
  'own-notes',
  'ai-draft',
  'open-reference',
  'hand-written',
  'content-pack',
  'imported',
]);

const QuestionSchema = z.object({
  id: z.string().min(1, 'id is required'),
  year: YearSchema,
  school: SchoolSchema.optional(),
  courseCode: z.string().optional(),
  subject: z.string().min(1, 'subject is required'),
  vmleSubject: VmleSubjectSchema,
  competencyId: z.string().min(1, 'competencyId is required'),
  // M1 LearningObject fields — accepted but not required (synthesized if absent)
  competencyIds: z.array(z.string()).optional(),
  courseRefs: z.array(z.object({
    school: z.enum(['UPLB', 'CLSU', 'PSAU', 'CHED']),
    year: z.number(),
    semester: z.number(),
    courseName: z.string(),
  })).optional(),
  links: z.array(z.string()).optional(),
  origin: z.object({ type: OriginTypeSchema, ref: z.string() }).optional(),
  updatedAt: z.number().optional(),
  version: z.number().optional(),
  packId: z.string().optional(),
  stem: z.string().min(10, 'stem must be at least 10 characters'),
  choices: z
    .array(
      z.object({
        key: ChoiceKeySchema,
        text: z.string().min(1),
      }),
    )
    .length(4, 'exactly 4 choices required'),
  answer: ChoiceKeySchema,
  explanation: z.string().min(1, 'explanation is required'),
  sourceType: SourceTypeSchema,
  source: z.string().min(1, 'source is required'),
  status: StatusSchema,
  notes: z.string().optional(),
  approvals: z
    .array(
      z.object({
        userId: z.string(),
        source: z.string(),
        at: z.number(),
      }),
    )
    .optional(),
});

export interface ImportResult {
  valid: Question[];
  errors: { index: number; id?: string; message: string }[];
  duplicateIds: string[];
}

export function validateImport(raw: unknown): ImportResult {
  let items: unknown[];

  if (Array.isArray(raw)) {
    items = raw;
  } else if (typeof raw === 'object' && raw !== null) {
    items = [raw];
  } else {
    return {
      valid: [],
      errors: [{ index: 0, message: 'Input must be a JSON array or a single question object' }],
      duplicateIds: [],
    };
  }

  const valid: Question[] = [];
  const errors: ImportResult['errors'] = [];

  for (let i = 0; i < items.length; i++) {
    const result = QuestionSchema.safeParse(items[i]);
    if (result.success) {
      valid.push(hydrateLearningObjectFields({ ...result.data, status: 'unverified' } as Parameters<typeof hydrateLearningObjectFields>[0]));
    } else {
      const idHint =
        typeof items[i] === 'object' && items[i] !== null && 'id' in (items[i] as object)
          ? String((items[i] as { id: unknown }).id)
          : undefined;
      const msg = result.error.issues[0]?.message ?? 'Validation failed';
      const field = result.error.issues[0]?.path.join('.') ?? '';
      errors.push({
        index: i + 1,
        ...(idHint !== undefined ? { id: idHint } : {}),
        message: field ? `${field}: ${msg}` : msg,
      });
    }
  }

  const seenIds = new Set<string>();
  const duplicateIds: string[] = [];
  for (const q of valid) {
    if (seenIds.has(q.id)) duplicateIds.push(q.id);
    seenIds.add(q.id);
  }

  return { valid, errors, duplicateIds };
}
