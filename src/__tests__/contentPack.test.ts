import { describe, it, expect } from 'vitest';
import { applyInstall, applyUpdate, applyRemove, buildInstalledPack, verifyChecksum } from '@/services/contentPack';
import type { Question } from '@/types/question';
import type { ContentPackManifest } from '@/types/contentPack';

function makeQ(id: string, packId?: string, updatedAt = 0): Question {
  const q: Question = {
    id,
    type: 'question',
    competencyIds: ['Veterinary Anatomy:A.1'],
    courseRefs: [],
    links: [],
    origin: { type: 'content-pack', ref: 'test' },
    status: 'unverified',
    updatedAt,
    version: 1,
    year: 3,
    subject: 'General Pathology',
    vmleSubject: 'Veterinary Pathology',
    competencyId: 'Veterinary Anatomy:A.1',
    stem: 'Which is correct about coagulative necrosis?',
    choices: [
      { key: 'A', text: 'Cell outline preserved' },
      { key: 'B', text: 'Liquefactive' },
      { key: 'C', text: 'Cheesy' },
      { key: 'D', text: 'Fat saponification' },
    ],
    answer: 'A',
    explanation: 'Coagulative preserves cell outline.',
    sourceType: 'content-pack',
    source: 'test',
  };
  if (packId !== undefined) q.packId = packId;
  return q;
}

const manifest: ContentPackManifest = {
  packId: 'pack-test',
  version: '1.0.0',
  schemaVersion: 1,
  name: 'Test Pack',
  files: { questions: 'questions.json' },
  checksum: '',
  createdAt: 0,
};

describe('applyInstall', () => {
  it('adds new questions not in existing store', () => {
    const incoming = [makeQ('q1', 'pack-test'), makeQ('q2', 'pack-test')];
    const { toAdd, skipped } = applyInstall(incoming, new Map());
    expect(toAdd).toHaveLength(2);
    expect(skipped).toBe(0);
  });

  it('skips user-modified rows (updatedAt > 0)', () => {
    const incoming = [makeQ('q1', 'pack-test')];
    const existing = new Map([['q1', makeQ('q1', 'pack-test', 9999)]]);
    const { toAdd, skipped } = applyInstall(incoming, existing);
    expect(toAdd).toHaveLength(0);
    expect(skipped).toBe(1);
  });

  it('overwrites pack-managed rows (updatedAt === 0)', () => {
    const incoming = [makeQ('q1', 'pack-test')];
    const existing = new Map([['q1', makeQ('q1', 'pack-test', 0)]]);
    const { toAdd, skipped } = applyInstall(incoming, existing);
    expect(toAdd).toHaveLength(1);
    expect(skipped).toBe(0);
  });
});

describe('applyUpdate', () => {
  it('updates pack-managed rows, skips user-modified', () => {
    const incoming = [makeQ('q1', 'pack-test'), makeQ('q2', 'pack-test')];
    const existing = new Map([
      ['q1', makeQ('q1', 'pack-test', 0)],    // pack-managed
      ['q2', makeQ('q2', 'pack-test', 8888)],  // user-modified
    ]);
    const { toUpdate, skipped } = applyUpdate(incoming, existing, 'pack-test');
    expect(toUpdate).toHaveLength(1);
    expect(toUpdate[0]!.id).toBe('q1');
    expect(skipped).toBe(1);
  });
});

describe('applyRemove', () => {
  it('deletes pack-managed rows, keeps user-modified rows', () => {
    const existing = [
      makeQ('q1', 'pack-test', 0),    // pack-managed → delete
      makeQ('q2', 'pack-test', 5000), // user-modified → keep
      makeQ('q3', 'other-pack', 0),   // different pack → not touched
    ];
    const { toDelete, kept } = applyRemove(existing, 'pack-test');
    expect(toDelete).toContain('q1');
    expect(toDelete).not.toContain('q2');
    expect(toDelete).not.toContain('q3');
    expect(kept).toBe(1);
  });
});

describe('buildInstalledPack', () => {
  it('creates InstalledPack from manifest and count', () => {
    const pack = buildInstalledPack(manifest, 5);
    expect(pack.packId).toBe('pack-test');
    expect(pack.version).toBe('1.0.0');
    expect(pack.questionCount).toBe(5);
    expect(pack.installedAt).toBeGreaterThan(0);
  });
});

describe('verifyChecksum', () => {
  it('returns true for a correctly computed checksum', async () => {
    // Build a manifest with correct checksum
    const m: ContentPackManifest = {
      packId: 'p1',
      version: '1.0.0',
      schemaVersion: 1,
      name: 'Test',
      files: {},
      checksum: '',
      createdAt: 0,
    };
    // Compute what the checksum should be
    const copy = { ...m, checksum: '' };
    const encoded = new TextEncoder().encode(JSON.stringify(copy));
    const buf = await crypto.subtle.digest('SHA-256', encoded);
    const hex = Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    m.checksum = hex;
    expect(await verifyChecksum(m)).toBe(true);
  });

  it('returns false for a wrong checksum', async () => {
    const m: ContentPackManifest = {
      packId: 'p1', version: '1.0.0', schemaVersion: 1, name: 'Test',
      files: {}, checksum: 'deadbeef', createdAt: 0,
    };
    expect(await verifyChecksum(m)).toBe(false);
  });
});
