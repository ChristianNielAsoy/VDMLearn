import { describe, it, expect } from 'vitest';
import {
  loadPreDvmCourses,
  getAllPreDvmTopics,
  getPreDvmCourse,
  getPreDvmTopic,
  preDvmTopicCount,
} from '@/data/loaders/preDvmTaxonomy';

describe('Pre-DVM taxonomy — structural integrity', () => {
  it('loads all 9 courses without throwing', () => {
    const courses = loadPreDvmCourses();
    expect(courses).toHaveLength(9);
  });

  it('every course has year 0 and vmleSubject null', () => {
    for (const course of loadPreDvmCourses()) {
      expect(course.year).toBe(0);
      expect(course.vmleSubject).toBeNull();
    }
  });

  it('every course has at least one section with at least one topic', () => {
    for (const course of loadPreDvmCourses()) {
      expect(course.sections.length).toBeGreaterThan(0);
      for (const section of course.sections) {
        expect(section.topics.length).toBeGreaterThan(0);
      }
    }
  });

  it('all topic ids match the PRE:<CODE>:<SEC>.<N> pattern', () => {
    const pattern = /^PRE:[A-Z][A-Z0-9-]+:[A-Z]\.\d+$/;
    for (const topic of getAllPreDvmTopics()) {
      expect(topic.id).toMatch(pattern);
    }
  });

  it('all topic ids are globally unique', () => {
    const ids = getAllPreDvmTopics().map((t) => t.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('all prerequisite ids reference existing topic ids', () => {
    const knownIds = new Set(getAllPreDvmTopics().map((t) => t.id));
    for (const topic of getAllPreDvmTopics()) {
      for (const prereq of topic.prerequisites) {
        expect(knownIds.has(prereq), `Unknown prerequisite ${prereq} in topic ${topic.id}`).toBe(
          true,
        );
      }
    }
  });

  it('no topic lists itself as a prerequisite', () => {
    for (const topic of getAllPreDvmTopics()) {
      expect(topic.prerequisites).not.toContain(topic.id);
    }
  });

  it('total topic count is at least 100', () => {
    expect(preDvmTopicCount()).toBeGreaterThanOrEqual(100);
  });

  it('getPreDvmCourse returns the correct course by code', () => {
    const c = getPreDvmCourse('CHEM-GEN');
    expect(c).toBeDefined();
    expect(c!.title).toMatch(/General/);
  });

  it('getPreDvmCourse returns undefined for unknown code', () => {
    expect(getPreDvmCourse('NONEXISTENT')).toBeUndefined();
  });

  it('getPreDvmTopic returns the correct topic by full id', () => {
    const t = getPreDvmTopic('PRE:CHEM-GEN:A.1');
    expect(t).toBeDefined();
    expect(t!.title).toMatch(/Atomic/);
  });

  it('getPreDvmTopic returns undefined for unknown id', () => {
    expect(getPreDvmTopic('PRE:CHEM-GEN:Z.99')).toBeUndefined();
  });

  it('every topic id embeds the correct course code', () => {
    for (const course of loadPreDvmCourses()) {
      for (const section of course.sections) {
        for (const topic of section.topics) {
          expect(topic.id.startsWith(`PRE:${course.code}:`)).toBe(true);
        }
      }
    }
  });
});
