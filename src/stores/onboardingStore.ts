import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { localRepository } from '@/db/repository';
import type { OnboardingProfile } from '@/types/onboarding';
import { DEFAULT_ONBOARDING_PROFILE, DEFAULT_MOCK_DURATION_MINUTES } from '@/types/onboarding';

export const useOnboardingStore = defineStore('onboarding', () => {
  const profile = ref<OnboardingProfile | null>(null);
  const loaded = ref(false);

  const isComplete = computed(() => profile.value?.completedAt !== undefined);
  const passRuleOverallPct = computed(
    () => profile.value?.passRuleOverallPct ?? DEFAULT_ONBOARDING_PROFILE.passRuleOverallPct,
  );
  const passRuleSubjectMinPct = computed(
    () => profile.value?.passRuleSubjectMinPct ?? DEFAULT_ONBOARDING_PROFILE.passRuleSubjectMinPct,
  );
  const mockDurationMinutes = computed(
    () => profile.value?.mockDurationMinutes ?? DEFAULT_MOCK_DURATION_MINUTES,
  );

  async function load() {
    if (loaded.value) return;
    const stored = await localRepository.getOnboardingProfile();
    profile.value = stored ?? null;
    loaded.value = true;
  }

  async function saveProfile(updates: Partial<Omit<OnboardingProfile, 'id'>>) {
    const current = profile.value ?? { ...DEFAULT_ONBOARDING_PROFILE };
    const next: OnboardingProfile = { ...current, ...updates, id: 'singleton' };
    await localRepository.saveOnboardingProfile(next);
    profile.value = next;
  }

  async function completeOnboarding() {
    await saveProfile({ completedAt: Date.now() });
  }

  async function reset() {
    await localRepository.saveOnboardingProfile({ ...DEFAULT_ONBOARDING_PROFILE });
    profile.value = null;
    loaded.value = false;
  }

  return {
    profile,
    loaded,
    isComplete,
    passRuleOverallPct,
    passRuleSubjectMinPct,
    mockDurationMinutes,
    load,
    saveProfile,
    completeOnboarding,
    reset,
  };
});
