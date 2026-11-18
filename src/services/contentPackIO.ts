import type { Question } from '@/types/question';
import type { ContentPackManifest, InstalledPack } from '@/types/contentPack';

export interface ContentPackBundle {
  bundleVersion: 1;
  manifest: ContentPackManifest;
  questions: Question[];
}

export interface BundleValidationError {
  code: string;
  message: string;
}

/** Compute SHA-256 hex digest if SubtleCrypto is available; returns '' otherwise. */
async function sha256Hex(data: string): Promise<string> {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    console.warn('contentPackIO: SubtleCrypto unavailable — checksum skipped');
    return '';
  }
  try {
    const bytes = new TextEncoder().encode(data);
    const hashBuf = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(hashBuf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  } catch {
    return '';
  }
}

/**
 * Build a ContentPackBundle from a set of questions.
 * The manifest is auto-generated; the caller provides a pack name and id.
 */
export async function buildBundle(params: {
  packId: string;
  name: string;
  description?: string;
  author?: string;
  questions: Question[];
}): Promise<ContentPackBundle> {
  const { packId, name, description, author, questions } = params;

  const manifestWithoutChecksum: Omit<ContentPackManifest, 'checksum'> = {
    packId,
    version: '1.0.0',
    schemaVersion: 1,
    name,
    ...(description !== undefined ? { description } : {}),
    ...(author !== undefined ? { author } : {}),
    files: { questions: 'questions.json' },
    createdAt: Date.now(),
  };

  // Compute checksum of the manifest (with empty checksum placeholder)
  const manifestForHash = JSON.stringify({ ...manifestWithoutChecksum, checksum: '' });
  const checksum = await sha256Hex(manifestForHash);

  const manifest: ContentPackManifest = { ...manifestWithoutChecksum, checksum };

  return { bundleVersion: 1, manifest, questions };
}

/** Download a content pack bundle as a JSON file. */
export function downloadBundle(bundle: ContentPackBundle): void {
  const json = JSON.stringify(bundle, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${bundle.manifest.packId}-v${bundle.manifest.version}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Validate and parse a ContentPackBundle from raw JSON text. */
export function parseBundle(text: string): {
  bundle: ContentPackBundle | null;
  errors: BundleValidationError[];
} {
  const errors: BundleValidationError[] = [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    errors.push({
      code: 'INVALID_JSON',
      message: `Not valid JSON: ${e instanceof Error ? e.message : String(e)}`,
    });
    return { bundle: null, errors };
  }

  if (typeof parsed !== 'object' || parsed === null) {
    errors.push({ code: 'NOT_OBJECT', message: 'Expected a JSON object' });
    return { bundle: null, errors };
  }

  const obj = parsed as Record<string, unknown>;

  if (obj['bundleVersion'] !== 1) {
    errors.push({
      code: 'BAD_BUNDLE_VERSION',
      message: `bundleVersion must be 1, got ${String(obj['bundleVersion'])}`,
    });
    return { bundle: null, errors };
  }

  const manifest = obj['manifest'] as Record<string, unknown> | undefined;
  if (!manifest || typeof manifest !== 'object') {
    errors.push({ code: 'MISSING_MANIFEST', message: 'Bundle is missing manifest' });
    return { bundle: null, errors };
  }

  if (!manifest['packId'] || typeof manifest['packId'] !== 'string') {
    errors.push({ code: 'MISSING_PACK_ID', message: 'manifest.packId is required' });
  }
  if (!manifest['name'] || typeof manifest['name'] !== 'string') {
    errors.push({ code: 'MISSING_NAME', message: 'manifest.name is required' });
  }

  const questions = obj['questions'];
  if (!Array.isArray(questions)) {
    errors.push({ code: 'MISSING_QUESTIONS', message: 'Bundle is missing questions array' });
    return { bundle: null, errors };
  }

  if (errors.length > 0) return { bundle: null, errors };

  return { bundle: parsed as ContentPackBundle, errors };
}

/** Build an InstalledPack record from a manifest + question count. */
export function manifestToInstalledPack(
  manifest: ContentPackManifest,
  questionCount: number,
): InstalledPack {
  return {
    packId: manifest.packId,
    version: manifest.version,
    name: manifest.name,
    ...(manifest.description !== undefined ? { description: manifest.description } : {}),
    ...(manifest.author !== undefined ? { author: manifest.author } : {}),
    installedAt: Date.now(),
    questionCount,
  };
}
