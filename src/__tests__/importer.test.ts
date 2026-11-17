import { describe, it, expect } from 'vitest';
import { validateImport } from '@/services/importer';

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

  it('rejects question with stem shorter than 10 chars', () => {
    const result = validateImport({ ...BASE, stem: 'Short?' });
    expect(result.valid).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
  });

  it('detects duplicate IDs within the batch', () => {
    const result = validateImport([BASE, BASE]);
    expect(result.duplicateIds).toContain('test-0001');
  });

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
});
