import { onMounted, onUnmounted } from 'vue';

export interface KeyboardShortcutHandlers {
  /** Called when user presses 1/2/3/4 (choice A/B/C/D) */
  onChoiceKey?: (index: 0 | 1 | 2 | 3) => void;
  /** Called when user presses Space or Enter */
  onConfirm?: () => void;
  /** Called when user presses Escape */
  onEscape?: () => void;
}

const CHOICE_KEYS: Record<string, 0 | 1 | 2 | 3> = {
  '1': 0,
  '2': 1,
  '3': 2,
  '4': 3,
  a: 0,
  b: 1,
  c: 2,
  d: 3,
};

export function useKeyboardShortcuts(handlers: KeyboardShortcutHandlers) {
  function handleKey(e: KeyboardEvent) {
    // Ignore when focus is inside an input/textarea
    const tag = (e.target as HTMLElement).tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    const key = e.key.toLowerCase();

    if (key in CHOICE_KEYS && handlers.onChoiceKey) {
      e.preventDefault();
      handlers.onChoiceKey(CHOICE_KEYS[key]!);
      return;
    }

    if ((key === ' ' || key === 'enter') && handlers.onConfirm) {
      e.preventDefault();
      handlers.onConfirm();
      return;
    }

    if (key === 'escape' && handlers.onEscape) {
      e.preventDefault();
      handlers.onEscape();
    }
  }

  onMounted(() => window.addEventListener('keydown', handleKey));
  onUnmounted(() => window.removeEventListener('keydown', handleKey));
}
