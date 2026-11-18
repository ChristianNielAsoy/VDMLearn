import { PreDvmCourseSchema } from '@/types/preDvmTaxonomy';
import type { PreDvmCourse, PreDvmTopic } from '@/types/preDvmTaxonomy';

import chemGen from '@/data/taxonomy/pre-chem-gen.json';
import chemOrg from '@/data/taxonomy/pre-chem-org.json';
import biochem from '@/data/taxonomy/pre-biochem.json';
import bioGen from '@/data/taxonomy/pre-bio-gen.json';
import stat from '@/data/taxonomy/pre-stat.json';
import genetics from '@/data/taxonomy/pre-genetics.json';
import animProd from '@/data/taxonomy/pre-anim-prod.json';
import animNutr from '@/data/taxonomy/pre-anim-nutr.json';
import physics from '@/data/taxonomy/pre-physics.json';

const RAW_COURSES = [
  chemGen,
  chemOrg,
  biochem,
  bioGen,
  stat,
  genetics,
  animProd,
  animNutr,
  physics,
];

let _courses: PreDvmCourse[] | null = null;

export function loadPreDvmCourses(): PreDvmCourse[] {
  if (_courses) return _courses;
  _courses = RAW_COURSES.map((raw) => PreDvmCourseSchema.parse(raw));
  return _courses;
}

export function getPreDvmCourse(code: string): PreDvmCourse | undefined {
  return loadPreDvmCourses().find((c) => c.code === code);
}

/** Flat list of every topic across all 9 courses. */
export function getAllPreDvmTopics(): PreDvmTopic[] {
  return loadPreDvmCourses().flatMap((c) => c.sections.flatMap((s) => s.topics));
}

/** Look up a topic by its full id (PRE:<CODE>:<SEC>.<N>). */
export function getPreDvmTopic(id: string): PreDvmTopic | undefined {
  return getAllPreDvmTopics().find((t) => t.id === id);
}

/** Total topic count across all courses. */
export function preDvmTopicCount(): number {
  return getAllPreDvmTopics().length;
}
