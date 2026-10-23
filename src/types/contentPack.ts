export interface ContentPackManifest {
  packId: string;
  version: string; // semver
  schemaVersion: 1;
  name: string;
  description?: string;
  author?: string;
  files: { questions?: string; lessons?: string };
  /** SHA-256 hex of manifest JSON with checksum:'' placeholder */
  checksum: string;
  createdAt: number; // unix ms
}

export interface InstalledPack {
  packId: string;
  version: string;
  name: string;
  description?: string;
  author?: string;
  installedAt: number; // unix ms
  questionCount: number;
}

export interface InstallResult {
  packId: string;
  added: number;
  skipped: number; // user-modified rows not overwritten
}

export interface UpdateResult {
  packId: string;
  updated: number;
  skipped: number;
}

export interface RemoveResult {
  packId: string;
  deleted: number;
  kept: number; // user-modified rows retained
}
