import type { ISODate, PerformanceLog, UserState } from '../types';
import { addDays, e1rm, inWindow, linearTrend, round } from '../stats';
import { EXERCISE_BY_ID } from './exercises';
import type { PlannedExercise } from './program';
import { strengthSeries } from '../scores';

export interface NextTarget {
  exerciseId: string;
  weightKg: number | null;
  repMin: number;
  repMax: number;
  sets: number;
  rirTarget: number;
  action: 'start' | 'hold' | 'add_reps' | 'increase_load' | 'decrease_load' | 'deload';
  message: string;
  lastSession?: { date: ISODate; summary: string; e1rm: number };
}

function roundLoad(kg: number, exerciseId: string): number {
  const ex = EXERCISE_BY_ID[exerciseId];
  const step = ex && !ex.compound ? 1 : kg < 30 ? 1 : 2.5;
  return Math.round(kg / step) * step;
}

/**
 * Double progression : fourchette de reps fixe ; quand toutes les séries atteignent le haut
 * de la fourchette avec RIR ≥ 2, on augmente la charge (+2,5 % haut du corps, +5 % bas du corps).
 */
export function nextTarget(planned: PlannedExercise, history: PerformanceLog[], deload = false): NextTarget {
  const logs = history.filter((h) => h.exerciseId === planned.exerciseId).sort((a, b) => (a.date < b.date ? -1 : 1));
  const lastLog = logs[logs.length - 1];
  const ex = EXERCISE_BY_ID[planned.exerciseId];
  const base = { exerciseId: planned.exerciseId, repMin: planned.repMin, repMax: planned.repMax, sets: planned.sets, rirTarget: planned.rirTarget };

  if (!lastLog || lastLog.sets.length === 0) {
    return { ...base, weightKg: null, action: 'start', message: `Première fois : trouve une charge qui te laisse ${planned.rirTarget}–${planned.rirTarget + 1} reps en réserve à ${planned.repMin}–${planned.repMax} répétitions. Note-la, le moteur prend le relais.` };
  }
  const sets = lastLog.sets;
  const w = Math.max(...sets.map((s) => s.weightKg));
  const best = Math.max(...sets.map((s) => e1rm(s.weightKg, s.reps, s.rir ?? 0)));
  const summary = sets.map((s) => `${s.weightKg}×${s.reps}${s.rir !== undefined ? ` @RIR${s.rir}` : ''}`).join(' · ');
  const last = { date: lastLog.date, summary, e1rm: round(best, 1) };

  if (deload) {
    return { ...base, sets: Math.max(2, Math.round(planned.sets * 0.6)), weightKg: roundLoad(w * 0.9, planned.exerciseId), action: 'deload', message: 'Semaine allégée : −40 % de séries, −10 % de charge. On dissipe la fatigue, on repart plus haut ensuite.', lastSession: last };
  }
  const allTop = sets.every((s) => s.reps >= planned.repMax && (s.rir ?? 2) >= 2);
  const anyBelow = sets.some((s) => s.reps < planned.repMin);
  if (allTop) {
    const inc = ex?.lowerBody ? 1.05 : 1.025;
    const nw = roundLoad(w * inc, planned.exerciseId);
    return { ...base, weightKg: nw > w ? nw : w + (ex?.compound ? 2.5 : 1), action: 'increase_load', message: `Toutes les séries au haut de la fourchette avec de la réserve : on monte à ${nw > w ? nw : w + (ex?.compound ? 2.5 : 1)} kg et on repart du bas de la fourchette (${planned.repMin}).`, lastSession: last };
  }
  if (anyBelow) {
    const nw = roundLoad(w * 0.95, planned.exerciseId);
    return { ...base, weightKg: nw, action: 'decrease_load', message: `Une série sous ${planned.repMin} reps la dernière fois : on allège légèrement (${nw} kg) pour rester dans la fourchette et accumuler du volume de qualité.`, lastSession: last };
  }
  return { ...base, weightKg: w, action: 'add_reps', message: `Même charge (${w} kg) : objectif +1 répétition sur au moins une série, en gardant ${planned.rirTarget} reps en réserve.`, lastSession: last };
}

export interface DeloadAssessment {
  recommended: boolean;
  reasons: string[];
  weeksSinceLast: number | null;
}

/** Deload si baisse de perf sur 2 semaines + récupération faible, ou toutes les 6–8 semaines. */
export function assessDeload(state: UserState, today: ISODate, recoveryScore: number): DeloadAssessment {
  const reasons: string[] = [];
  const str = linearTrend(inWindow(strengthSeries(state), addDays(today, -13), today), 0.3);
  const perfDown = Boolean(str && str.direction === 'down' && str.points >= 3);
  if (perfDown && recoveryScore < 50) reasons.push('Performances en baisse sur 2 semaines et récupération faible.');
  const lastDeload = [...state.decisions].reverse().find((d) => d.summary.toLowerCase().includes('deload'));
  const firstSession = [...state.sessions].sort((a, b) => (a.date < b.date ? -1 : 1))[0];
  const since = lastDeload ? lastDeload.date : firstSession?.date;
  const weeksSinceLast = since ? Math.floor((Date.parse(today) - Date.parse(since)) / (7 * 86_400_000)) : null;
  if (weeksSinceLast !== null && weeksSinceLast >= 8) reasons.push(`${weeksSinceLast} semaines sans semaine allégée.`);
  return { recommended: reasons.length > 0, reasons, weeksSinceLast };
}
