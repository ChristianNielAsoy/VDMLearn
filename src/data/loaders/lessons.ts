import lessonsRaw from '@/data/lessons/sample.json';
import type { Lesson } from '@/types/lesson';

export function loadLessons(): Lesson[] {
  return lessonsRaw as unknown as Lesson[];
}
