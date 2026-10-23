import { describe, it, expect } from 'vitest';
import { parseWikiLinks, resolveWikiLink, renderWikiLinksAsText, extractBacklinks, findBacklinks } from '@/services/wikiLinks';

// Known competency ids from vmle-tos-2024.json:
//   "Veterinary Anatomy:A.1"  → section A, topic 1 ("Organs and structures...")
//   "Veterinary Anatomy:A.1.1" → sub 1.1 ("Skeletal")

const KNOWN_ID = 'Veterinary Anatomy:A.1';
const KNOWN_SUB_ID = 'Veterinary Anatomy:A.1.1';
const UNKNOWN_ID = 'Veterinary Anatomy:Z.99.99';

describe('resolveWikiLink', () => {
  it('resolves a known competency id', () => {
    const result = resolveWikiLink(KNOWN_ID);
    expect(result).not.toBeNull();
    expect(result?.subject).toBe('Veterinary Anatomy');
  });

  it('returns null for an unknown competency id', () => {
    expect(resolveWikiLink(UNKNOWN_ID)).toBeNull();
  });

  it('resolves a known sub-competency id', () => {
    const result = resolveWikiLink(KNOWN_SUB_ID);
    expect(result).not.toBeNull();
    expect(result?.text).toMatch(/skeletal/i);
  });
});

describe('parseWikiLinks', () => {
  it('returns empty array when no wiki links', () => {
    const links = parseWikiLinks('No links here.');
    expect(links).toHaveLength(0);
  });

  it('parses a single [[id]] link', () => {
    const links = parseWikiLinks(`See [[${KNOWN_ID}]].`);
    expect(links).toHaveLength(1);
    expect(links[0]?.competencyId).toBe(KNOWN_ID);
    expect(links[0]?.displayText).toBe(KNOWN_ID);
    expect(links[0]?.resolved).not.toBeNull();
  });

  it('parses [[id|label]] with custom display text', () => {
    const links = parseWikiLinks(`See [[${KNOWN_ID}|Osteology]].`);
    expect(links[0]?.competencyId).toBe(KNOWN_ID);
    expect(links[0]?.displayText).toBe('Osteology');
  });

  it('marks unknown ids with resolved: null', () => {
    const links = parseWikiLinks(`[[${UNKNOWN_ID}]]`);
    expect(links[0]?.resolved).toBeNull();
  });

  it('parses multiple links in one body', () => {
    const links = parseWikiLinks(`[[${KNOWN_ID}]] and [[${KNOWN_SUB_ID}|Skeletal]]`);
    expect(links).toHaveLength(2);
  });
});

describe('renderWikiLinksAsText', () => {
  it('expands resolved links with subject and text', () => {
    const result = renderWikiLinksAsText(`See [[${KNOWN_ID}]].`);
    expect(result).toContain('Veterinary Anatomy');
    expect(result).not.toContain('[[');
  });

  it('marks unresolved links with [?]', () => {
    const result = renderWikiLinksAsText(`[[${UNKNOWN_ID}]]`);
    expect(result).toContain('[?]');
    expect(result).not.toContain('[[');
  });

  it('uses custom label in output', () => {
    const result = renderWikiLinksAsText(`[[${KNOWN_ID}|Osteology]]`);
    expect(result).toContain('Osteology');
    expect(result).not.toContain('|');
  });

  it('leaves non-link text unchanged', () => {
    const result = renderWikiLinksAsText('Hello world');
    expect(result).toBe('Hello world');
  });
});

describe('extractBacklinks / findBacklinks', () => {
  it('extractBacklinks returns true when note mentions targetId', () => {
    const body = `Related: [[${KNOWN_ID}]]`;
    expect(extractBacklinks(KNOWN_ID, body)).toBe(true);
  });

  it('extractBacklinks returns false when targetId is not mentioned', () => {
    expect(extractBacklinks(KNOWN_ID, 'No links here')).toBe(false);
  });

  it('findBacklinks returns ids of notes that link to target', () => {
    const notes = [
      { competencyId: 'Veterinary Anatomy:A.2', bodyMd: `See [[${KNOWN_ID}]]` },
      { competencyId: 'Veterinary Physiology:A.1', bodyMd: 'No links' },
      { competencyId: 'Veterinary Anatomy:A.3', bodyMd: `Also [[${KNOWN_ID}|bones]]` },
    ];
    const backlinks = findBacklinks(KNOWN_ID, notes);
    expect(backlinks).toHaveLength(2);
    expect(backlinks).toContain('Veterinary Anatomy:A.2');
    expect(backlinks).toContain('Veterinary Anatomy:A.3');
  });
});
