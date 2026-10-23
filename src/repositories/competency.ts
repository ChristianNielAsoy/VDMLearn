import type { VmleSubject } from '@/types/question';
import type { SchoolKey, ResolvedCourse } from '@/types/curriculum';
import { loadTos } from '@/data/loaders/tos';
import {
  getYearsForSchool,
  getSemestersForYear,
  getCoursesForSemester,
  loadCurricula,
} from '@/data/loaders/curriculum';

export interface CompetencyNode {
  id: string; // e.g. "Veterinary Anatomy:A.1.1"
  subject: VmleSubject;
  sectionId: string;
  text: string;
  items: number; // TOS items out of 100 per subject exam
  examSharePct: number; // items/100 * examWeightPct — overall fraction of the VMLE
}

export interface CompetencyRepository {
  /** Resolve a fully-qualified competency id to its TOS node. */
  getCompetency(id: string): CompetencyNode | null;
  /** All leaf competency nodes, optionally filtered to one VMLE subject. */
  getLeafCompetencies(subject?: VmleSubject): CompetencyNode[];
  getSchools(): SchoolKey[];
  getYears(school: SchoolKey): number[];
  getSemesters(school: SchoolKey, year: number): number[];
  getCourses(school: SchoolKey, year: number, semester: number): ResolvedCourse[];
}

function buildLeaves(): CompetencyNode[] {
  const tos = loadTos();
  const nodes: CompetencyNode[] = [];

  for (const subject of tos.subjects) {
    for (const section of subject.sections) {
      for (const topic of section.topics) {
        if (!topic.sub || topic.sub.length === 0) {
          const id = `${subject.name}:${section.id}.${topic.id}`;
          nodes.push({
            id,
            subject: subject.name as VmleSubject,
            sectionId: section.id,
            text: topic.text,
            items: topic.items,
            examSharePct: (topic.items / 100) * subject.examWeightPct,
          });
        } else {
          for (const sub of topic.sub) {
            const id = `${subject.name}:${section.id}.${sub.id}`;
            nodes.push({
              id,
              subject: subject.name as VmleSubject,
              sectionId: section.id,
              text: sub.text,
              items: sub.items,
              examSharePct: (sub.items / 100) * subject.examWeightPct,
            });
          }
        }
      }
    }
  }

  return nodes;
}

let _leaves: CompetencyNode[] | null = null;
let _byId: Map<string, CompetencyNode> | null = null;

function getLeaves(): CompetencyNode[] {
  if (!_leaves) {
    _leaves = buildLeaves();
    _byId = new Map(_leaves.map((n) => [n.id, n]));
  }
  return _leaves;
}

function getById(): Map<string, CompetencyNode> {
  getLeaves(); // ensures _byId is populated
  return _byId!;
}

export const competencyRepository: CompetencyRepository = {
  getCompetency(id: string): CompetencyNode | null {
    return getById().get(id) ?? null;
  },

  getLeafCompetencies(subject?: VmleSubject): CompetencyNode[] {
    const all = getLeaves();
    return subject ? all.filter((n) => n.subject === subject) : all;
  },

  getSchools(): SchoolKey[] {
    return [...loadCurricula().keys()];
  },

  getYears(school: SchoolKey): number[] {
    return getYearsForSchool(school);
  },

  getSemesters(school: SchoolKey, year: number): number[] {
    return getSemestersForYear(school, year);
  },

  getCourses(school: SchoolKey, year: number, semester: number): ResolvedCourse[] {
    return getCoursesForSemester(school, year, semester);
  },
};
