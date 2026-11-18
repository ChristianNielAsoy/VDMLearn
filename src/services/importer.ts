import { z } from 'zod';
import type { Question, VmleSubject, BloomLevel } from '@/types/question';
import { VMLE_SUBJECTS } from '@/types/question';
import { hydrateLearningObjectFields } from '@/data/loaders/questions';

const ChoiceKeySchema = z.enum(['A', 'B', 'C', 'D']);
const SourceTypeSchema = z.enum(['own-notes', 'ai-draft', 'open-reference', 'hand-written']);
const SchoolSchema = z.enum(['UPLB', 'CLSU', 'PSAU', 'CHED']);
const StatusSchema = z.enum(['unverified', 'verified', 'flagged']);
const BloomLevelSchema = z.enum(['R', 'U', 'Ap', 'An', 'E', 'C']);
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

const ALL_OF_ABOVE_RE = /\b(all|none)\s+of\s+(the\s+)?(above|choices|options)\b/i;

const ChoicesSchema = z
  .array(
    z.object({
      key: ChoiceKeySchema,
      text: z.string().min(1),
    }),
  )
  .length(4, 'exactly 4 choices required')
  .refine(
    (choices) => new Set(choices.map((c) => c.text.trim().toLowerCase())).size === choices.length,
    { message: 'All choice texts must be distinct' },
  )
  .refine((choices) => !choices.some((c) => ALL_OF_ABOVE_RE.test(c.text)), {
    message: 'Avoid "all/none of the above" answer choices — use specific distractors',
  });

const QuestionSchema = z
  .object({
    id: z.string().min(1, 'id is required'),
    year: YearSchema,
    school: SchoolSchema.optional(),
    courseCode: z.string().optional(),
    subject: z.string().min(1, 'subject is required'),
    vmleSubject: VmleSubjectSchema,
    competencyId: z.string().min(1, 'competencyId is required'),
    // M1 LearningObject fields — accepted but not required (synthesized if absent)
    competencyIds: z.array(z.string()).optional(),
    courseRefs: z
      .array(
        z.object({
          school: z.enum(['UPLB', 'CLSU', 'PSAU', 'CHED']),
          year: z.number(),
          semester: z.number(),
          courseName: z.string(),
        }),
      )
      .optional(),
    links: z.array(z.string()).optional(),
    origin: z.object({ type: OriginTypeSchema, ref: z.string() }).optional(),
    updatedAt: z.number().optional(),
    version: z.number().optional(),
    packId: z.string().optional(),
    stem: z
      .string()
      .min(20, 'stem must be at least 20 characters')
      .max(500, 'stem must be under 500 characters'),
    choices: ChoicesSchema,
    answer: ChoiceKeySchema,
    explanation: z.string().min(20, 'explanation must be at least 20 characters'),
    sourceType: SourceTypeSchema,
    source: z
      .string()
      .min(15, 'source must include title and page (min 15 characters)'),
    status: StatusSchema,
    bloomLevel: BloomLevelSchema.optional(),
    importedAt: z.number().optional(),
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
  })
  .superRefine((data, ctx) => {
    if (!data.choices.some((c) => c.key === data.answer)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['answer'],
        message: `answer key "${data.answer}" does not match any choice key`,
      });
    }
  });

export interface ImportResult {
  valid: Question[];
  errors: { index: number; id?: string; message: string }[];
  duplicateIds: string[];
  warnings: string[];
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
      warnings: [],
    };
  }

  const now = Date.now();
  const valid: Question[] = [];
  const errors: ImportResult['errors'] = [];

  for (let i = 0; i < items.length; i++) {
    const result = QuestionSchema.safeParse(items[i]);
    if (result.success) {
      const hydrated = hydrateLearningObjectFields({
        ...result.data,
        status: 'unverified',
        importedAt: now,
      } as Parameters<typeof hydrateLearningObjectFields>[0]);
      valid.push(hydrated);
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

  // Duplicate ID detection
  const seenIds = new Set<string>();
  const duplicateIds: string[] = [];
  for (const q of valid) {
    if (seenIds.has(q.id)) duplicateIds.push(q.id);
    seenIds.add(q.id);
  }

  // Duplicate stem detection (warning, not error)
  const warnings: string[] = [];
  const seenStems = new Map<string, string>();
  for (const q of valid) {
    const stemKey = q.stem.trim().toLowerCase();
    const prior = seenStems.get(stemKey);
    if (prior) {
      warnings.push(`Duplicate stem detected: "${q.id}" matches "${prior}"`);
    } else {
      seenStems.set(stemKey, q.id);
    }
  }

  return { valid, errors, duplicateIds, warnings };
}

/** Type guard to check if a question is ready for solo verification (importedAt + 24h). */
export function isVerifiable(q: Question): boolean {
  if (q.status !== 'unverified' || q.importedAt === undefined) return false;
  return Date.now() - q.importedAt >= 24 * 60 * 60 * 1000;
}

// Re-export BloomLevel so callers don't need a separate import
export type { BloomLevel };
