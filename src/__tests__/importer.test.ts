import { describe, it, expect } from 'vitest';
import { validateImport, isVerifiable } from '@/services/importer';

const BASE: Record<string, unknown> = {
  id: 'test-0001',
  year: 3,
  subject: 'General Pathology',
  vmleSubject: 'Veterinary Pathology',
  competencyId: 'Veterinary Pathology:A.1',
  stem: 'Which of the following best describes coagulative necrosis?',
  choices: [
    { key: 'A', text: 'Cell outline preserved, nucleus dissolved' },
    { key: 'B', text: 'Liquefactive destruction of tissue' },
    { key: 'C', text: 'Cheesy, friable material' },
    { key: 'D', text: 'Fat saponification' },
  ],
  answer: 'A',
  explanation:
    'Coagulative necrosis preserves the cell outline while the nucleus undergoes karyolysis.',
  sourceType: 'ai-draft',
  source: 'Zachary JF. Pathologic Basis of Veterinary Disease, 6th ed., p. 12',
  status: 'unverified',
};

describe('validateImport', () => {
  // ── Core acceptance ────────────────────────────────────────────────
  it('accepts a valid single question object', () => {
    const result = validateImport(BASE);
    expect(result.valid).toHaveLength(1);
    expect(result.errors).toHaveLength(0);
  });

  it('accepts a valid array of questions', () => {
    const result = validateImport([BASE, { ...BASE, id: 'test-0002' }]);
    expect(result.valid).toHaveLength(2);
    expect(result.errors).toHaveLength(0);
  });

  it('forces status to unverified even if input says verified', () => {
    const result = validateImport({ ...BASE, status: 'verified' });
    expect(result.valid[0]?.status).toBe('unverified');
  });

  it('sets importedAt to a recent timestamp on every valid question', () => {
    const before = Date.now();
    const result = validateImport(BASE);
    const after = Date.now();
    const ts = result.valid[0]?.importedAt;
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });

  it('accepts optional bloomLevel field', () => {
    const result = validateImport({ ...BASE, bloomLevel: 'An' });
    expect(result.valid[0]?.bloomLevel).toBe('An');
    expect(result.errors).toHaveLength(0);
  });

  it('rejects invalid bloomLevel', () => {
    const result = validateImport({ ...BASE, bloomLevel: 'X' });
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.message).toContain('bloomLevel');
  });

  // ── Type / input errors ────────────────────────────────────────────
  it('rejects non-JSON-object input', () => {
    const result = validateImport('not an object');
    expect(result.valid).toHaveLength(0);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('rejects question with missing required field', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, ...noId } = BASE;
    const result = validateImport(noId);
    expect(result.valid).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
  });

  it('rejects question with invalid vmleSubject', () => {
    const result = validateImport({ ...BASE, vmleSubject: 'Astrology' });
    expect(result.valid).toHaveLength(0);
    expect(result.errors[0]?.message).toContain('vmleSubject');
  });

  it('rejects question with wrong number of choices', () => {
    const result = validateImport({
      ...BASE,
      choices: [
        { key: 'A', text: 'Option A' },
        { key: 'B', text: 'Option B' },
      ],
    });
    expect(result.valid).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
  });

  // ── Stem rules ─────────────────────────────────────────────────────
  it('rejects stem shorter than 20 characters', () => {
    const result = validateImport({ ...BASE, stem: 'Short question?' });
    expect(result.valid).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
  });

  it('rejects stem longer than 500 characters', () => {
    const result = validateImport({ ...BASE, stem: 'A'.repeat(501) + '?' });
    expect(result.valid).toHaveLength(0);
    expect(result.errors[0]?.message).toContain('500');
  });

  // ── Explanation / source rules ─────────────────────────────────────
  it('rejects explanation shorter than 20 characters', () => {
    const result = validateImport({ ...BASE, explanation: 'Too short.' });
    expect(result.valid).toHaveLength(0);
    expect(result.errors[0]?.message).toContain('20');
  });

  it('rejects source shorter than 15 characters', () => {
    const result = validateImport({ ...BASE, source: 'unknown' });
    expect(result.valid).toHaveLength(0);
    expect(result.errors[0]?.message).toContain('15');
  });

  // ── Choice lint rules ──────────────────────────────────────────────
  it('rejects duplicate choice texts', () => {
    const result = validateImport({
      ...BASE,
      choices: [
        { key: 'A', text: 'Same text' },
        { key: 'B', text: 'Same text' },
        { key: 'C', text: 'Different' },
        { key: 'D', text: 'Also different' },
      ],
    });
    expect(result.valid).toHaveLength(0);
    expect(result.errors[0]?.message).toContain('distinct');
  });

  it('rejects "all of the above" choice text', () => {
    const result = validateImport({
      ...BASE,
      choices: [
        { key: 'A', text: 'Option A' },
        { key: 'B', text: 'Option B' },
        { key: 'C', text: 'Option C' },
        { key: 'D', text: 'All of the above' },
      ],
    });
    expect(result.valid).toHaveLength(0);
    expect(result.errors[0]?.message).toContain('all/none');
  });

  it('rejects "none of the above" choice text', () => {
    const result = validateImport({
      ...BASE,
      choices: [
        { key: 'A', text: 'Option A' },
        { key: 'B', text: 'Option B' },
        { key: 'C', text: 'None of the above' },
        { key: 'D', text: 'Option D' },
      ],
    });
    expect(result.valid).toHaveLength(0);
    expect(result.errors[0]?.message).toContain('all/none');
  });

  // ── Answer key rules ───────────────────────────────────────────────
  it('rejects when answer key is not represented in choices', () => {
    const result = validateImport({
      ...BASE,
      choices: [
        { key: 'A', text: 'Option A' },
        { key: 'A', text: 'Option A dup' },
        { key: 'B', text: 'Option B' },
        { key: 'C', text: 'Option C' },
      ],
      answer: 'D',
    });
    expect(result.valid).toHaveLength(0);
    expect(result.errors[0]?.message).toContain('answer key');
  });

  // ── Duplicate detection ────────────────────────────────────────────
  it('detects duplicate IDs within the batch', () => {
    const result = validateImport([BASE, BASE]);
    expect(result.duplicateIds).toContain('test-0001');
  });

  it('warns on duplicate stems within the batch', () => {
    const q2 = { ...BASE, id: 'test-0002' };
    const result = validateImport([BASE, q2]);
    expect(result.warnings.some((w) => w.includes('Duplicate stem'))).toBe(true);
  });

  // ── Batch mixing ───────────────────────────────────────────────────
  it('accepts optional notes field', () => {
    const notes = 'Remember: coagulative = cell shape preserved';
    const result = validateImport({ ...BASE, notes });
    expect(result.valid[0]?.notes).toBe(notes);
  });

  it('mixes valid and invalid in one batch', () => {
    const bad = { ...BASE, id: 'test-0002', vmleSubject: 'Fake Subject' };
    const result = validateImport([BASE, bad]);
    expect(result.valid).toHaveLength(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.index).toBe(2);
  });

  it('returns error object with index and id hint', () => {
    const bad = { ...BASE, stem: 'Hi' };
    const result = validateImport([bad]);
    expect(result.errors[0]?.id).toBe('test-0001');
    expect(result.errors[0]?.index).toBe(1);
  });

  it('result has warnings array even when empty', () => {
    const result = validateImport(BASE);
    expect(Array.isArray(result.warnings)).toBe(true);
  });
});

describe('isVerifiable', () => {
  it('returns false when status is not unverified', () => {
    const q = { status: 'verified', importedAt: Date.now() - 90_000_000 } as Parameters<
      typeof isVerifiable
    >[0];
    expect(isVerifiable(q)).toBe(false);
  });

  it('returns false when importedAt is missing', () => {
    const q = { status: 'unverified' } as Parameters<typeof isVerifiable>[0];
    expect(isVerifiable(q)).toBe(false);
  });

  it('returns false when importedAt is less than 24h ago', () => {
    const q = {
      status: 'unverified',
      importedAt: Date.now() - 10_000,
    } as Parameters<typeof isVerifiable>[0];
    expect(isVerifiable(q)).toBe(false);
  });

  it('returns true when unverified and importedAt is 24h+ ago', () => {
    const q = {
      status: 'unverified',
      importedAt: Date.now() - 25 * 60 * 60 * 1000,
    } as Parameters<typeof isVerifiable>[0];
    expect(isVerifiable(q)).toBe(true);
  });
});
