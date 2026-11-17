export interface TosSubCompetency {
  id: string;
  text: string;
  items: number;
}

export interface TosCompetency {
  id: string;
  text: string;
  items: number;
  sub?: TosSubCompetency[];
}

export interface TosSection {
  id: string;
  name: string;
  weight: number;
  topics: TosCompetency[];
}

export interface TosSubject {
  name: string;
  examWeightPct: number;
  itemsPerExam: number;
  bloomTotals: Record<string, number>;
  sections: TosSection[];
  notes?: string[];
}

export interface TosData {
  _meta: {
    source: string;
    checks: string;
    howToUse: string;
    bloom: string;
    printedOddities: string[];
  };
  subjects: TosSubject[];
}

export interface CourseEntry {
  name: string;
  units: number;
  vmleSubject: string;
  code?: string;
}

export type SchoolKey = 'UPLB' | 'CLSU' | 'PSAU' | 'CHED';

export interface SchoolCurriculumData {
  _meta: { source: string };
  school?: SchoolKey;
  vmleWeights?: Record<string, number>;
  program: Record<string, Record<string, CourseEntry[]>>;
}

export interface ResolvedCourse {
  school: SchoolKey;
  year: number;
  semester: number;
  name: string;
  units: number;
  vmleSubject: string;
  code?: string;
}
