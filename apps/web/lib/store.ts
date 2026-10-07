'use client';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { SetLog } from '@recomp/engine';
import {
  buildDemoState,
  toISODate,
  type BodyPhotoMeta,
  type CoachDecision,
  type DailyCheckin,
  type LifeEvent,
  type MealLog,
  type Measurement,
  type PerformanceLog,
  type Profile,
  type UserState,
  type WorkoutSession,
} from '@recomp/engine';

export interface ChatMsg { role: 'user' | 'assistant'; content: string; meta?: { source: string; evidenceIds: string[] } }

interface Store {
  state: UserState | null;
  chat: ChatMsg[];
  /** brouillon de séance (date → exercice → séries), survit à la navigation et au rechargement */
  draft: { date: string; logs: Record<string, SetLog[]>; subs: Record<string, string> } | null;
  setDraft: (d: Store['draft']) => void;
  hydrated: boolean;
  setHydrated: () => void;
  loadDemo: () => void;
  reset: () => void;
  createFromProfile: (p: Profile) => void;
  updateProfile: (patch: Partial<Profile>) => void;
  addMeasurement: (m: Measurement) => void;
  upsertCheckin: (c: DailyCheckin) => void;
  upsertSession: (s: WorkoutSession) => void;
  addPerformance: (p: PerformanceLog) => void;
  addMeal: (m: MealLog) => void;
  addLifeEvent: (e: LifeEvent) => void;
  removeLifeEvent: (id: string) => void;
  addPhoto: (p: BodyPhotoMeta) => void;
  setPhotoAssessment: (id: string, a: BodyPhotoMeta['selfAssessment']) => void;
  setPhotoAnalysis: (id: string, analysis: BodyPhotoMeta['analysis']) => void;
  addDecision: (d: CoachDecision) => void;
  pushChat: (m: ChatMsg) => void;
  clearChat: () => void;
}

export const today = () => toISODate(new Date());

const emptyFrom = (profile: Profile): UserState => ({ profile, measurements: [{ date: today(), weightKg: profile.startWeightKg, protocolOk: true }], checkins: [], sessions: [], performance: [], meals: [], lifeEvents: [], photos: [], decisions: [{ date: today(), summary: 'Stratégie initiale définie à partir de ton profil.', why: 'Point de départ ; ajusté après 14 jours de données.', evidenceId: 'recomposition_feasibility' }] });

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      state: null,
      chat: [],
      draft: null,
      setDraft: (d) => set({ draft: d }),
      hydrated: false,
      setHydrated: () => set({ hydrated: true }),
      loadDemo: () => set({ state: buildDemoState(today()), chat: [] }),
      reset: () => set({ state: null, chat: [] }),
      createFromProfile: (p) => set({ state: emptyFrom(p), chat: [] }),
      updateProfile: (patch) => { const s = get().state; if (s) set({ state: { ...s, profile: { ...s.profile, ...patch } } }); },
      addMeasurement: (m) => { const s = get().state; if (!s) return; const rest = s.measurements.filter((x) => x.date !== m.date); const prev = s.measurements.find((x) => x.date === m.date) ?? {}; set({ state: { ...s, measurements: [...rest, { ...prev, ...m }].sort((a, b) => (a.date < b.date ? -1 : 1)) } }); },
      upsertCheckin: (c) => { const s = get().state; if (!s) return; set({ state: { ...s, checkins: [...s.checkins.filter((x) => x.date !== c.date), c].sort((a, b) => (a.date < b.date ? -1 : 1)) } }); },
      upsertSession: (w) => { const s = get().state; if (!s) return; set({ state: { ...s, sessions: [...s.sessions.filter((x) => x.id !== w.id && x.date !== w.date), w] } }); },
      addPerformance: (p) => { const s = get().state; if (!s) return; set({ state: { ...s, performance: [...s.performance.filter((x) => !(x.date === p.date && x.exerciseId === p.exerciseId)), p] } }); },
      addMeal: (m) => { const s = get().state; if (!s) return; set({ state: { ...s, meals: [...s.meals, m] } }); },
      addLifeEvent: (e) => { const s = get().state; if (!s) return; set({ state: { ...s, lifeEvents: [...s.lifeEvents, e] } }); },
      removeLifeEvent: (id) => { const s = get().state; if (!s) return; set({ state: { ...s, lifeEvents: s.lifeEvents.filter((e) => e.id !== id) } }); },
      addPhoto: (p) => { const s = get().state; if (!s) return; set({ state: { ...s, photos: [...s.photos, p] } }); },
      setPhotoAnalysis: (id, analysis) => { const s = get().state; if (!s) return; set({ state: { ...s, photos: s.photos.map((p) => (p.id === id ? { ...p, analysis } : p)) } }); },
      setPhotoAssessment: (id, a) => { const s = get().state; if (!s) return; set({ state: { ...s, photos: s.photos.map((p) => (p.id === id ? { ...p, selfAssessment: a } : p)) } }); },
      addDecision: (d) => { const s = get().state; if (!s) return; set({ state: { ...s, decisions: [...s.decisions, d] } }); },
      pushChat: (m) => set({ chat: [...get().chat, m].slice(-60) }),
      clearChat: () => set({ chat: [] }),
    }),
    {
      name: 'recomp-v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ state: s.state, chat: s.chat, draft: s.draft }),
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    },
  ),
);

/** Clé bêta (facultative) envoyée aux routes API quand le serveur l'exige. */
export function betaHeaders(): Record<string, string> {
  try { const k = localStorage.getItem('recomp-beta-key'); return k ? { 'x-recomp-beta-key': k } : {}; } catch { return {}; }
}
