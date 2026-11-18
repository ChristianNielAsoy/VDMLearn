import type { School } from '@/types/question';

export interface OnboardingProfile {
  id: 'singleton';
  targetSchool?: School;
  targetExamDate?: number; // unix ms; mirrors plannerSettings.examDate
  passRuleOverallPct: number; // default 75
  passRuleSubjectMinPct: number; // default 60
  /** Minutes per mock exam block. Default 120. UNVERIFIED — confirm at prc.gov.ph. */
  mockDurationMinutes: number;
  /** Show confidence tap BEFORE feedback (default true). Evidence: hypercorrection effect. */
  showConfidenceTap: boolean;
  /** Show optional self-explanation textarea after answer feedback (default false). */
  selfExplanation: boolean;
  /** Mix new-material sessions across subjects (default false; due reviews always mixed). */
  forceMixedSessions: boolean;
  completedAt?: number; // unix ms; undefined = wizard not finished
}

export const DEFAULT_PASS_RULES = {
  passRuleOverallPct: 75,
  passRuleSubjectMinPct: 60,
} as const;

export const DEFAULT_MOCK_DURATION_MINUTES = 120;

export const DEFAULT_ONBOARDING_PROFILE: OnboardingProfile = {
  id: 'singleton',
  passRuleOverallPct: DEFAULT_PASS_RULES.passRuleOverallPct,
  passRuleSubjectMinPct: DEFAULT_PASS_RULES.passRuleSubjectMinPct,
  mockDurationMinutes: DEFAULT_MOCK_DURATION_MINUTES,
  showConfidenceTap: true,
  selfExplanation: false,
  forceMixedSessions: false,
};
