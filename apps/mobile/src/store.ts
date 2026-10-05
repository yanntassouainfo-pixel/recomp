import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { buildDemoState, computeState, toISODate, type DailyCheckin, type Measurement, type PerformanceLog, type UserState, type WorkoutSession } from '@recomp/engine';

export const today = () => toISODate(new Date());

interface Store {
  state: UserState | null;
  loadDemo: () => void;
  upsertCheckin: (c: DailyCheckin) => void;
  addMeasurement: (m: Measurement) => void;
  upsertSession: (s: WorkoutSession) => void;
  addPerformance: (p: PerformanceLog) => void;
}

/** Même modèle que le web : write-through local ; la synchro Supabase se branche ici (file d'attente hors-ligne). */
export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      state: null,
      loadDemo: () => set({ state: buildDemoState(today()) }),
      upsertCheckin: (c) => { const s = get().state; if (s) set({ state: { ...s, checkins: [...s.checkins.filter((x) => x.date !== c.date), c] } }); },
      addMeasurement: (m) => { const s = get().state; if (s) set({ state: { ...s, measurements: [...s.measurements.filter((x) => x.date !== m.date), m].sort((a, b) => (a.date < b.date ? -1 : 1)) } }); },
      upsertSession: (w) => { const s = get().state; if (s) set({ state: { ...s, sessions: [...s.sessions.filter((x) => x.date !== w.date), w] } }); },
      addPerformance: (p) => { const s = get().state; if (s) set({ state: { ...s, performance: [...s.performance.filter((x) => !(x.date === p.date && x.exerciseId === p.exerciseId)), p] } }); },
    }),
    { name: 'recomp-mobile-v1', storage: createJSONStorage(() => AsyncStorage) },
  ),
);

export function useComputed() {
  const state = useStore((s) => s.state);
  return { state, computed: state ? computeState(state, today()) : null };
}
