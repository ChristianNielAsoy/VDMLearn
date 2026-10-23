import type { Question } from '@/types/question';
import type { ContentPackManifest, InstalledPack, InstallResult, UpdateResult, RemoveResult } from '@/types/contentPack';

/** A row is user-modified if updatedAt > 0 */
function isUserModified(q: Question): boolean {
  return q.updatedAt > 0;
}

/**
 * Install a content pack into an existing question store.
 * Returns counts of added and skipped (user-modified) rows.
 * Never overwrites user-modified rows.
 */
export function applyInstall(
  incoming: Question[],
  existing: Map<string, Question>,
): { toAdd: Question[]; skipped: number } {
  const toAdd: Question[] = [];
  let skipped = 0;
  for (const q of incoming) {
    const current = existing.get(q.id);
    if (current && isUserModified(current)) {
      skipped++;
    } else {
      toAdd.push(q);
    }
  }
  return { toAdd, skipped };
}

/**
 * Update a content pack — overwrites pack-managed rows, skips user-modified rows.
 */
export function applyUpdate(
  incoming: Question[],
  existing: Map<string, Question>,
  packId: string,
): { toUpdate: Question[]; skipped: number } {
  const toUpdate: Question[] = [];
  let skipped = 0;
  for (const q of incoming) {
    const current = existing.get(q.id);
    if (current && isUserModified(current)) {
      skipped++;
    } else {
      toUpdate.push({ ...q, packId });
    }
  }
  return { toUpdate, skipped };
}

/**
 * Remove a content pack — deletes pack-managed rows, keeps user-modified rows.
 */
export function applyRemove(
  existing: Question[],
  packId: string,
): { toDelete: string[]; kept: number } {
  const toDelete: string[] = [];
  let kept = 0;
  for (const q of existing) {
    if (q.packId !== packId) continue;
    if (isUserModified(q)) {
      kept++;
    } else {
      toDelete.push(q.id);
    }
  }
  return { toDelete, kept };
}

export function buildInstalledPack(
  manifest: ContentPackManifest,
  questionCount: number,
): InstalledPack {
  const pack: InstalledPack = {
    packId: manifest.packId,
    version: manifest.version,
    name: manifest.name,
    installedAt: Date.now(),
    questionCount,
  };
  if (manifest.description !== undefined) pack.description = manifest.description;
  if (manifest.author !== undefined) pack.author = manifest.author;
  return pack;
}

/** Verify SHA-256 checksum of manifest (checksum field set to '' before hashing). */
export async function verifyChecksum(manifest: ContentPackManifest): Promise<boolean> {
  if (typeof crypto?.subtle?.digest !== 'function') {
    console.warn('[contentPack] SHA-256 unavailable (insecure origin); skipping checksum');
    return true;
  }
  const expected = manifest.checksum;
  const copy = { ...manifest, checksum: '' };
  const encoded = new TextEncoder().encode(JSON.stringify(copy));
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hex === expected;
}

export type { ContentPackManifest, InstalledPack, InstallResult, UpdateResult, RemoveResult };
