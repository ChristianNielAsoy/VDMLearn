import type { Question } from '@/types/question';
import type { TosData } from '@/types/curriculum';

export const DAY_SUBJECTS: Record<1 | 2 | 3, string[]> = {
  1: ['Veterinary Anatomy', 'Veterinary Physiology', 'Zootechnics'],
  2: ['Veterinary Pathology', 'Veterinary Pharmacology', 'Veterinary Medicine'],
  3: ['Veterinary Microbiology and Public Health', 'Veterinary Parasitology', 'Veterinary Surgery'],
};

export const MOCK_DURATION_SECONDS = 2 * 60 * 60; // 2 hours per block

function shuffled<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = result[i]!;
    result[i] = result[j]!;
    result[j] = tmp;
  }
  return result;
}

function buildTosLimits(subjectName: string, tosData: TosData): Map<string, number> {
  const subject = tosData.subjects.find((s) => s.name === subjectName);
  const limits = new Map<string, number>();
  if (!subject) return limits;

  for (const section of subject.sections) {
    for (const topic of section.topics) {
      if (topic.sub && topic.sub.length > 0) {
        for (const sub of topic.sub) {
          limits.set(`${subjectName}:${section.id}.${sub.id}`, sub.items);
        }
      } else {
        limits.set(`${subjectName}:${section.id}.${topic.id}`, topic.items);
      }
    }
  }
  return limits;
}

export function drawForSubject(
  subjectName: string,
  pool: Question[],
  tosData: TosData,
): Question[] {
  const subject = tosData.subjects.find((s) => s.name === subjectName);
  if (!subject) return [];

  const tosLimits = buildTosLimits(subjectName, tosData);

  const byComp = new Map<string, Question[]>();
  for (const q of pool) {
    if (!byComp.has(q.competencyId)) byComp.set(q.competencyId, []);
    byComp.get(q.competencyId)!.push(q);
  }

  const drawn: Question[] = [];
  for (const [compId, questions] of byComp) {
    const limit = tosLimits.get(compId) ?? questions.length;
    drawn.push(...shuffled(questions).slice(0, limit));
  }

  return shuffled(drawn);
}

export function drawMockQuestions(
  subjects: string[],
  allQuestions: Question[],
  tosData: TosData,
): Question[] {
  const result: Question[] = [];
  for (const subject of subjects) {
    const pool = allQuestions.filter((q) => q.vmleSubject === subject);
    result.push(...drawForSubject(subject, pool, tosData));
  }
  return result;
}

export function subjectQuestionCount(allQuestions: Question[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const q of allQuestions) {
    counts.set(q.vmleSubject, (counts.get(q.vmleSubject) ?? 0) + 1);
  }
  return counts;
}
