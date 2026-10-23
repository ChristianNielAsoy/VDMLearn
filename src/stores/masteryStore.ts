import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { localRepository } from '@/db/repository';
import { loadAllQuestions } from '@/data/loaders/questions';
import { competencyRepository } from '@/repositories/competency';
import { computeMastery, type ReadinessReport } from '@/services/mastery';
import { useOnboardingStore } from '@/stores/onboardingStore';

export const useMasteryStore = defineStore('mastery', () => {
  const onboardingStore = useOnboardingStore();

  const report = ref<ReadinessReport | null>(null);
  const loading = ref(false);
  const lastComputedAt = ref(0);

  // Stale after 5 minutes
  const isStale = computed(() => Date.now() - lastComputedAt.value > 5 * 60_000);

  async function refresh(force = false) {
    if (!force && !isStale.value && report.value) return;
    loading.value = true;
    try {
      await onboardingStore.load();
      const [allQuestions, allProgress, reviewEvents] = await Promise.all([
        loadAllQuestions(),
        localRepository.getAllProgress(),
        localRepository.getReviewEvents(),
      ]);
      const competencies = competencyRepository.getLeafCompetencies();

      report.value = computeMastery({
        reviewEvents,
        allProgress,
        allQuestions,
        competencies,
        passRuleOverallPct: onboardingStore.passRuleOverallPct,
        passRuleSubjectMinPct: onboardingStore.passRuleSubjectMinPct,
      });
      lastComputedAt.value = Date.now();
    } finally {
      loading.value = false;
    }
  }

  return { report, loading, isStale, refresh };
});
