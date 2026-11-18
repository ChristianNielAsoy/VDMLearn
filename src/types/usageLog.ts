export type UsageEventKind = 'session_start' | 'session_end' | 'feature_open';

export interface UsageLogEntry {
  id?: number; // Dexie auto-increment PK
  kind: UsageEventKind;
  feature: string; // e.g. 'quiz', 'mock', 'flashcards', 'lessons', 'hub'
  ts: number; // unix ms
  /** For session_end: duration in ms */
  durationMs?: number;
  /** For session_end: items answered */
  items?: number;
  /** For session_end: correct answers */
  correct?: number;
  /** For session_end: quiz scope type */
  mode?: string;
}
