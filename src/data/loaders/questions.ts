import type { Question, SourceType } from '@/types/question';
import type { OriginInfo } from '@/types/learningObject';
import sampleRaw from '../questions/sample.json';
import { localRepository } from '@/db/repository';

type RawQuestion = Omit<Question, 'type' | 'competencyIds' | 'courseRefs' | 'links' | 'origin' | 'updatedAt' | 'version'> &
  Partial<Pick<Question, 'type' | 'competencyIds' | 'courseRefs' | 'links' | 'origin' | 'updatedAt' | 'version'>>;

// Synthesize M1 LearningObject base fields that may be absent in seed JSON
// or pre-v8 DB rows. Called by the loader and by getImportedQuestions().
export function hydrateLearningObjectFields(raw: RawQuestion): Question {
  const origin: OriginInfo = raw.origin ?? {
    type: raw.sourceType as SourceType,
    ref: raw.source,
  };
  return {
    ...raw,
    type: 'question',
    competencyIds: raw.competencyIds ?? [raw.competencyId],
    courseRefs: raw.courseRefs ?? [],
    links: raw.links ?? [],
    origin,
    updatedAt: raw.updatedAt ?? 0,
    version: raw.version ?? 1,
  } as Question;
}

const seed = (sampleRaw as unknown as RawQuestion[]).map(hydrateLearningObjectFields);

export async function loadAllQuestions(): Promise<Question[]> {
  const imported = await localRepository.getImportedQuestions();
  // seed first; imported questions override by id
  const byId = new Map<string, Question>(seed.map((q) => [q.id, q]));
  for (const raw of imported) {
    byId.set(raw.id, hydrateLearningObjectFields(raw as RawQuestion));
  }
  return [...byId.values()];
}
