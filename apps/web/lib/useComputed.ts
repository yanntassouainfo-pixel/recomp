'use client';
import { useMemo } from 'react';
import { computeState, type ComputedState, type UserState } from '@recomp/engine';
import { today, useStore } from './store';

export function useComputed(): { state: UserState | null; computed: ComputedState | null; hydrated: boolean } {
  const state = useStore((s) => s.state);
  const hydrated = useStore((s) => s.hydrated);
  const computed = useMemo(() => (state ? computeState(state, today()) : null), [state]);
  return { state, computed, hydrated };
}
