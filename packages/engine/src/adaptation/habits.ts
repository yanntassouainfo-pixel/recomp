import type { ISODate, UserState } from '../types';
import { addDays, mean } from '../stats';
import { checkinsIn, sessionAdherence } from '../scores';

export interface Habit {
  id: string;
  text: string;
  why: string;
  target: string;
}

/** 1 à 3 priorités par semaine. Jamais 15. */
export function selectWeeklyHabits(state: UserState, today: ISODate): Habit[] {
  const p = state.profile;
  const from = addDays(today, -13);
  const cks = checkinsIn(state, from, today);
  const adh = sessionAdherence(state, from, today);
  const out: Habit[] = [];

  if (adh === null || adh < 0.85) {
    out.push({ id: 'sessions', text: `${p.sessionsPerWeek} séances de musculation`, why: 'La régularité est le premier déterminant du résultat.', target: `${p.sessionsPerWeek}/${p.sessionsPerWeek}` });
  }
  const meals = state.meals.filter((m) => m.date >= from);
  const proteinOk = meals.length >= 5 && mean(meals.map((m) => m.proteinServings ?? 3)) >= 3;
  if (!proteinOk) {
    out.push({ id: 'protein_each_meal', text: 'Une source de protéines à chaque repas', why: 'Préserve le muscle en déficit et calme la faim.', target: '3 repas / jour' });
  }
  if (cks.length >= 5) {
    const sleep = mean(cks.map((c) => c.sleepHours));
    if (sleep < 7 && out.length < 3) {
      out.push({ id: 'bedtime', text: 'Coucher avant 23 h 30 au moins 5 soirs', why: 'Sous 6,5 h de sommeil, la perte se déplace vers le muscle et la faim augmente.', target: '5/7 soirs' });
    }
    const steps = cks.map((c) => c.steps).filter((s): s is number => typeof s === 'number');
    if (steps.length && mean(steps) < 7000 && out.length < 3) {
      const target = Math.round((mean(steps) + 1500) / 500) * 500;
      out.push({ id: 'steps', text: `${target} pas par jour`, why: 'Dépense sans fatigue nerveuse, +1 500 par rapport à ton habitude : tenable.', target: `${target}/j` });
    }
  }
  if (out.length < 2) {
    out.push({ id: 'waist', text: 'Mesurer le tour de taille dimanche matin', why: 'Ta mesure la plus fiable, 30 secondes par semaine.', target: '1×' });
  }
  if (out.length < 2) {
    out.push({ id: 'checkin', text: 'Check-in quotidien (30 s)', why: 'C’est ce qui permet au coach d’adapter ta séance et tes apports.', target: '7/7' });
  }
  return out.slice(0, 3);
}
