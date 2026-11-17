import { ref, computed, onUnmounted } from 'vue';

export function useTimer(initialSeconds: number) {
  const remaining = ref(initialSeconds);
  const running = ref(false);
  let intervalId: ReturnType<typeof setInterval> | null = null;

  const expired = computed(() => remaining.value <= 0);

  const display = computed(() => {
    const s = Math.max(0, remaining.value);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) {
      return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    }
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  });

  function start() {
    if (running.value || expired.value) return;
    running.value = true;
    intervalId = setInterval(() => {
      if (remaining.value > 0) {
        remaining.value--;
      } else {
        stop();
      }
    }, 1000);
  }

  function stop() {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
    running.value = false;
  }

  function reset(seconds?: number) {
    stop();
    remaining.value = seconds ?? initialSeconds;
  }

  onUnmounted(() => stop());

  return { remaining, expired, running, display, start, stop, reset };
}
