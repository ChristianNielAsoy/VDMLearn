import type { School } from '@/types/question';

export interface OnboardingProfile {
  id: 'singleton';
  targetSchool?: School;
  targetExamDate?: number;    // unix ms; mirrors plannerSettings.examDate
  passRuleOverallPct: number;    // default 75
  passRuleSubjectMinPct: number; // default 60
  completedAt?: number;          // unix ms; undefined = wizard not finished
}

export const DEFAULT_PASS_RULES = {
  passRuleOverallPct: 75,
  passRuleSubjectMinPct: 60,
} as const;

export const DEFAULT_ONBOARDING_PROFILE: OnboardingProfile = {
  id: 'singleton',
  passRuleOverallPct: DEFAULT_PASS_RULES.passRuleOverallPct,
  passRuleSubjectMinPct: DEFAULT_PASS_RULES.passRuleSubjectMinPct,
};
