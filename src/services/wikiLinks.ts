import { loadTos, getCompetencyById } from '@/data/loaders/tos';

// Wiki link syntax: [[competencyId]] or [[competencyId|display text]]
const WIKI_LINK_RE = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;

export interface WikiLink {
  competencyId: string;
  displayText: string;
  /** null when competencyId is not found in the TOS */
  resolved: { subject: string; text: string } | null;
}

export function parseWikiLinks(markdown: string): WikiLink[] {
  const tos = loadTos();
  const links: WikiLink[] = [];
  let match: RegExpExecArray | null;
  WIKI_LINK_RE.lastIndex = 0;
  while ((match = WIKI_LINK_RE.exec(markdown)) !== null) {
    const competencyId = match[1]!.trim();
    const displayText = match[2]?.trim() ?? competencyId;
    const node = getCompetencyById(tos, competencyId);
    const link: WikiLink = { competencyId, displayText, resolved: null };
    if (node) link.resolved = { subject: node.subject, text: node.text };
    links.push(link);
  }
  return links;
}

export function resolveWikiLink(competencyId: string): { subject: string; text: string } | null {
  const tos = loadTos();
  const node = getCompetencyById(tos, competencyId);
  if (!node) return null;
  return { subject: node.subject, text: node.text };
}

/**
 * Replaces [[id]] / [[id|label]] wiki links in markdown with plain text.
 * Resolved links: "label (subject › text)". Unresolved: "label [?]".
 */
export function renderWikiLinksAsText(markdown: string): string {
  const tos = loadTos();
  return markdown.replace(WIKI_LINK_RE, (_full, rawId: string, rawLabel: string | undefined) => {
    const competencyId = rawId.trim();
    const label = rawLabel?.trim() ?? competencyId;
    const node = getCompetencyById(tos, competencyId);
    if (node) return `${label} (${node.subject} › ${node.text})`;
    return `${label} [?]`;
  });
}

/**
 * Returns all competencyIds that link TO the given competencyId in any note body.
 */
export function extractBacklinks(targetId: string, noteBodyMd: string): boolean {
  WIKI_LINK_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = WIKI_LINK_RE.exec(noteBodyMd)) !== null) {
    if (match[1]!.trim() === targetId) return true;
  }
  return false;
}

/**
 * Given an array of {competencyId, bodyMd}, returns the ids that link to targetId.
 */
export function findBacklinks(
  targetId: string,
  allNotes: { competencyId: string; bodyMd: string }[],
): string[] {
  return allNotes.filter((n) => extractBacklinks(targetId, n.bodyMd)).map((n) => n.competencyId);
}
