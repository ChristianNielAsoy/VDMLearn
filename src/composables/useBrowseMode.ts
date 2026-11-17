import { ref } from 'vue';

export type BrowseMode = 'exam' | 'course';

export function useBrowseMode() {
  const mode = ref<BrowseMode>('exam');

  function setMode(newMode: BrowseMode) {
    mode.value = newMode;
  }

  return { mode, setMode };
}
