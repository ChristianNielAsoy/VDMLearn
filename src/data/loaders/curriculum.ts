import type { SchoolCurriculumData, SchoolKey, ResolvedCourse } from '@/types/curriculum';

import cmoRaw from '../curriculum.cmo2018.json';
import uplbRaw from '../curriculum.uplb2018.json';
import clsuRaw from '../curriculum.clsu2024.partial.json';
import psauRaw from '../curriculum.psau2018.json';

const SCHOOL_DATA: Record<SchoolKey, SchoolCurriculumData> = {
  CHED: cmoRaw,
  UPLB: uplbRaw,
  CLSU: clsuRaw,
  PSAU: psauRaw,
};

export const SCHOOL_LABELS: Record<SchoolKey, string> = {
  CHED: 'CHED CMO 2018 (national sample)',
  UPLB: 'UPLB CVM (2018–2019)',
  CLSU: 'CLSU CVSM (2024, years 1–3)',
  PSAU: 'PSAU CVM (2018)',
};

let _cache: Map<SchoolKey, ResolvedCourse[]> | null = null;

function resolveSchool(school: SchoolKey): ResolvedCourse[] {
  const raw = SCHOOL_DATA[school];
  const courses: ResolvedCourse[] = [];

  const program = raw.program;
  for (const yearKey of Object.keys(program)) {
    const year = parseInt(yearKey, 10);
    const yearData = program[yearKey];
    if (!yearData) continue;

    // Handle mid-year / special semesters keyed as strings
    for (const semKey of Object.keys(yearData)) {
      const sem = parseInt(semKey, 10) || 0;
      const entries = yearData[semKey];
      if (!Array.isArray(entries)) continue;

      for (const entry of entries) {
        courses.push({
          school,
          year,
          semester: sem,
          name: entry.name,
          units: entry.units,
          vmleSubject: entry.vmleSubject,
          ...(entry.code !== undefined ? { code: entry.code } : {}),
        });
      }
    }
  }

  return courses;
}

export function loadCurricula(): Map<SchoolKey, ResolvedCourse[]> {
  if (_cache) return _cache;

  _cache = new Map();
  for (const school of Object.keys(SCHOOL_DATA) as SchoolKey[]) {
    try {
      _cache.set(school, resolveSchool(school));
    } catch (e) {
      throw new Error(`Curriculum load error for ${school}: ${String(e)}`, { cause: e });
    }
  }
  return _cache;
}

export function getCoursesForSchool(school: SchoolKey): ResolvedCourse[] {
  return loadCurricula().get(school) ?? [];
}

export function getYearsForSchool(school: SchoolKey): number[] {
  const courses = getCoursesForSchool(school);
  return [...new Set(courses.map((c) => c.year))].sort((a, b) => a - b);
}

export function getSemestersForYear(school: SchoolKey, year: number): number[] {
  const courses = getCoursesForSchool(school);
  return [...new Set(courses.filter((c) => c.year === year).map((c) => c.semester))].sort(
    (a, b) => a - b,
  );
}

export function getCoursesForSemester(
  school: SchoolKey,
  year: number,
  semester: number,
): ResolvedCourse[] {
  return getCoursesForSchool(school).filter((c) => c.year === year && c.semester === semester);
}
