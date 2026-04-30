export type OnboardingStep = 1 | 2 | 3 | 4;

export interface Invitee {
  email: string;
  role: 'admin' | 'member' | 'viewer';
}

export interface OnboardingState {
  step: OnboardingStep;
  orgName: string;
  orgSlug: string;
  invitees: Invitee[];
  projectName: string;
  projectColor: string;
}

export const PRESET_COLORS = [
  '#7c3aed',
  '#2563eb',
  '#16a34a',
  '#dc2626',
  '#ea580c',
  '#0891b2',
  '#db2777',
  '#65a30d',
] as const;

export const INITIAL_ONBOARDING_STATE: OnboardingState = {
  step: 1,
  orgName: '',
  orgSlug: '',
  invitees: [],
  projectName: '',
  projectColor: PRESET_COLORS[0],
};
