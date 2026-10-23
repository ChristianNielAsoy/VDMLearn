import { describe, it, expect, beforeEach } from 'vitest';
import { competencyRepository } from '@/repositories/competency';
import { VMLE_SUBJECTS } from '@/types/question';

// Reset module-level cache between tests
beforeEach(() => {
  // The repository caches on first call; tests share the same cache which is fine
  // since the underlying TOS data is read-only and deterministic.
});

describe('competencyRepository.getCompetency', () => {
  it('resolves a known sub-competency id', () => {
    const node = competencyRepository.getCompetency('Veterinary Anatomy:A.1.1');
    expect(node).not.toBeNull();
    expect(node?.subject).toBe('Veterinary Anatomy');
    expect(node?.sectionId).toBe('A');
    expect(node?.items).toBe(1);
    expect(node?.examSharePct).toBeCloseTo((1 / 100) * 10, 5);
  });

  it('resolves a leaf topic with no sub-competencies', () => {
    const node = competencyRepository.getCompetency('Veterinary Physiology:A.7');
    expect(node).not.toBeNull();
    expect(node?.subject).toBe('Veterinary Physiology');
    expect(node?.items).toBe(4);
  });

  it('returns null for an unknown id', () => {
    expect(competencyRepository.getCompetency('Veterinary Anatomy:Z.99.99')).toBeNull();
  });

  it('returns null for a malformed id (no colon)', () => {
    expect(competencyRepository.getCompetency('no-colon-here')).toBeNull();
  });
});

describe('competencyRepository.getLeafCompetencies', () => {
  it('returns all leaf competencies when no subject filter given', () => {
    const all = competencyRepository.getLeafCompetencies();
    expect(all.length).toBeGreaterThan(0);
    // Every VMLE subject should be represented
    const subjects = new Set(all.map((n) => n.subject));
    for (const s of VMLE_SUBJECTS) {
      expect(subjects.has(s), `subject ${s} missing`).toBe(true);
    }
  });

  it('filters correctly to Veterinary Anatomy', () => {
    const nodes = competencyRepository.getLeafCompetencies('Veterinary Anatomy');
    expect(nodes.length).toBeGreaterThan(0);
    expect(nodes.every((n) => n.subject === 'Veterinary Anatomy')).toBe(true);
  });

  it('every leaf has a valid id, items > 0, and examSharePct > 0', () => {
    const all = competencyRepository.getLeafCompetencies();
    for (const node of all) {
      expect(node.id).toMatch(/^.+:.+$/);
      expect(node.items).toBeGreaterThan(0);
      expect(node.examSharePct).toBeGreaterThan(0);
    }
  });
});

describe('competencyRepository.getSchools', () => {
  it('returns all 4 schools', () => {
    const schools = competencyRepository.getSchools();
    expect(schools).toHaveLength(4);
    expect(schools).toContain('UPLB');
    expect(schools).toContain('CLSU');
    expect(schools).toContain('PSAU');
    expect(schools).toContain('CHED');
  });
});

describe('competencyRepository.getYears / getSemesters / getCourses', () => {
  it('returns years for UPLB', () => {
    const years = competencyRepository.getYears('UPLB');
    expect(years.length).toBeGreaterThan(0);
    expect(years).toContain(1);
  });

  it('returns semesters for UPLB year 1', () => {
    const sems = competencyRepository.getSemesters('UPLB', 1);
    expect(sems.length).toBeGreaterThan(0);
  });

  it('getCourses returns non-empty for UPLB year 1 semester 1', () => {
    const sems = competencyRepository.getSemesters('UPLB', 1);
    const firstSem = sems[0];
    if (firstSem === undefined) return; // guard for noUncheckedIndexedAccess
    const courses = competencyRepository.getCourses('UPLB', 1, firstSem);
    expect(courses.length).toBeGreaterThan(0);
    expect(courses[0]?.name).toBeTruthy();
  });
});
