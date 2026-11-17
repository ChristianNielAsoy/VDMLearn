import { describe, test, expect } from 'vitest';
import { useBrowseMode } from '@/composables/useBrowseMode';

describe('useBrowseMode', () => {
  test('default mode is "exam"', () => {
    const { mode } = useBrowseMode();
    expect(mode.value).toBe('exam');
  });

  test('setMode("course") switches to course view', () => {
    const { mode, setMode } = useBrowseMode();
    setMode('course');
    expect(mode.value).toBe('course');
  });

  test('setMode("exam") switches back to exam view', () => {
    const { mode, setMode } = useBrowseMode();
    setMode('course');
    setMode('exam');
    expect(mode.value).toBe('exam');
  });

  test('each call to useBrowseMode returns independent state', () => {
    const a = useBrowseMode();
    const b = useBrowseMode();
    a.setMode('course');
    expect(a.mode.value).toBe('course');
    expect(b.mode.value).toBe('exam');
  });
});
