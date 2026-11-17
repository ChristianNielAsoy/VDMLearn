import { z } from 'zod';
import type { TosData, TosSubject } from '@/types/curriculum';
import rawTos from '../vmle-tos-2024.json';

const SubCompetencySchema = z.object({
  id: z.string(),
  text: z.string(),
  items: z.number().int().nonnegative(),
});

const CompetencySchema = z.object({
  id: z.string(),
  text: z.string(),
  items: z.number().int().nonnegative(),
  sub: z.array(SubCompetencySchema).optional(),
});

const SectionSchema = z.object({
  id: z.string(),
  name: z.string(),
  weight: z.number().nonnegative(),
  topics: z.array(CompetencySchema).min(1),
});

const SubjectSchema = z.object({
  name: z.string().min(1),
  examWeightPct: z.number().nonnegative(),
  itemsPerExam: z.number().int().positive(),
  bloomTotals: z.record(z.string(), z.number()),
  sections: z.array(SectionSchema).min(1),
  notes: z.array(z.string()).optional(),
});

const TosSchema = z.object({
  _meta: z.object({
    source: z.string(),
    checks: z.string(),
    howToUse: z.string(),
    bloom: z.string(),
    printedOddities: z.array(z.string()),
  }),
  subjects: z.array(SubjectSchema).length(9),
});

function leafItemsForCompetency(c: z.infer<typeof CompetencySchema>): number {
  if (!c.sub || c.sub.length === 0) return c.items;
  return c.sub.reduce((sum, s) => sum + s.items, 0);
}

function validateInvariants(subjects: TosSubject[]): void {
  let totalWeight = 0;

  for (const subject of subjects) {
    totalWeight += subject.examWeightPct;

    let subjectLeafSum = 0;
    for (const section of subject.sections) {
      for (const topic of section.topics) {
        const leafTotal = leafItemsForCompetency(topic);
        if (topic.sub && topic.sub.length > 0 && leafTotal !== topic.items) {
          throw new Error(
            `TOS invariant: ${subject.name} section ${section.id} topic ${topic.id} ` +
              `children sum (${leafTotal}) ≠ parent items (${topic.items})`,
          );
        }
        subjectLeafSum += topic.sub && topic.sub.length > 0 ? leafTotal : topic.items;
      }
    }

    if (subjectLeafSum !== subject.itemsPerExam) {
      throw new Error(
        `TOS invariant: ${subject.name} leaf items sum (${subjectLeafSum}) ≠ itemsPerExam (${subject.itemsPerExam})`,
      );
    }
  }

  if (Math.round(totalWeight) !== 100) {
    throw new Error(`TOS invariant: exam weights sum (${totalWeight}) ≠ 100`);
  }
}

let _cached: TosData | null = null;

export function loadTos(): TosData {
  if (_cached) return _cached;

  const result = TosSchema.safeParse(rawTos);
  if (!result.success) {
    throw new Error(`TOS schema invalid: ${result.error.message}`);
  }

  const tos = result.data as TosData;
  validateInvariants(tos.subjects);
  _cached = tos;
  return tos;
}

export function getCompetencyById(
  tosData: TosData,
  competencyId: string,
): { subject: string; sectionId: string; topicId: string; text: string; items: number } | null {
  const colonIdx = competencyId.indexOf(':');
  if (colonIdx === -1) return null;

  const subjectName = competencyId.slice(0, colonIdx);
  const rest = competencyId.slice(colonIdx + 1);
  const parts = rest.split('.');
  const sectionId = parts[0]!;
  const leafId = parts.slice(1).join('.');

  const subject = tosData.subjects.find((s) => s.name === subjectName);
  if (!subject) return null;

  const section = subject.sections.find((s) => s.id === sectionId);
  if (!section) return null;

  for (const topic of section.topics) {
    if (!leafId || topic.id === leafId) {
      return {
        subject: subjectName,
        sectionId,
        topicId: topic.id,
        text: topic.text,
        items: topic.items,
      };
    }
    if (topic.sub) {
      const sub = topic.sub.find((s) => s.id === leafId);
      if (sub) {
        return {
          subject: subjectName,
          sectionId,
          topicId: sub.id,
          text: sub.text,
          items: sub.items,
        };
      }
    }
  }

  return null;
}
