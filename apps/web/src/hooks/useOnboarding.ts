import { useState, useCallback } from 'react';
import {
  OnboardingState,
  OnboardingStep,
  Invitee,
  INITIAL_ONBOARDING_STATE,
} from '../types/onboarding.types';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function useOnboarding() {
  const [state, setState] = useState<OnboardingState>(INITIAL_ONBOARDING_STATE);

  const setOrgName = useCallback((name: string) => {
    setState((s) => ({ ...s, orgName: name, orgSlug: slugify(name) }));
  }, []);

  const setOrgSlug = useCallback((slug: string) => {
    setState((s) => ({ ...s, orgSlug: slug }));
  }, []);

  const addInvitee = useCallback((invitee: Invitee) => {
    setState((s) => ({
      ...s,
      invitees: [...s.invitees, invitee],
    }));
  }, []);

  const removeInvitee = useCallback((email: string) => {
    setState((s) => ({
      ...s,
      invitees: s.invitees.filter((inv) => inv.email !== email),
    }));
  }, []);

  const setProjectName = useCallback((name: string) => {
    setState((s) => ({ ...s, projectName: name }));
  }, []);

  const setProjectColor = useCallback((color: string) => {
    setState((s) => ({ ...s, projectColor: color }));
  }, []);

  const nextStep = useCallback(() => {
    setState((s) => {
      const next = (s.step + 1) as OnboardingStep;
      return next <= 4 ? { ...s, step: next } : s;
    });
  }, []);

  const prevStep = useCallback(() => {
    setState((s) => {
      const prev = (s.step - 1) as OnboardingStep;
      return prev >= 1 ? { ...s, step: prev } : s;
    });
  }, []);

  return {
    state,
    setOrgName,
    setOrgSlug,
    addInvitee,
    removeInvitee,
    setProjectName,
    setProjectColor,
    nextStep,
    prevStep,
  };
}
