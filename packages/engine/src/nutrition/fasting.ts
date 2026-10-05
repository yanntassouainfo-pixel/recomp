import type { ISODate, UserState } from '../types';
import { addDays, inWindow, linearTrend, mean } from '../stats';
import { strengthSeries } from '../scores';

export interface FastingAssessment {
  verdict: 'ok' | 'caution' | 'not_recommended';
  suggestedWindow: '12/12' | '14/10' | '16/8' | null;
  reasons: string[];
  evidenceId: 'time_restricted_eating';
}

/**
 * Le jeûne est un outil, jamais une obligation. On le déconseille dès qu'il dégrade
 * faim, énergie, sommeil, performance ou l'atteinte des protéines.
 */
export function assessFasting(state: UserState, today: ISODate, proteinTargetG?: number): FastingAssessment {
  const cks = inWindow(state.checkins, addDays(today, -13), today);
  const reasons: string[] = [];
  let penalties = 0;
  if (state.profile.risk.eatingDisorderHistory || state.profile.risk.pregnant || state.profile.risk.minor) {
    return { verdict: 'not_recommended', suggestedWindow: null, reasons: ['Profil nécessitant de la prudence : pas de fenêtre alimentaire restreinte.'], evidenceId: 'time_restricted_eating' };
  }
  if (cks.length >= 5) {
    const hunger = mean(cks.map((c) => c.hunger));
    const energy = mean(cks.map((c) => c.energy));
    const sleep = mean(cks.map((c) => c.sleepHours));
    if (hunger >= 3.6) { penalties++; reasons.push('Faim déjà élevée ces deux semaines.'); }
    if (energy <= 2.6) { penalties++; reasons.push('Énergie basse.'); }
    if (sleep < 6.5) { penalties++; reasons.push('Sommeil court : une fenêtre réduite risque de l’aggraver.'); }
  } else {
    reasons.push('Pas assez de check-ins pour évaluer : on attend 2 semaines de données.');
    return { verdict: 'caution', suggestedWindow: null, reasons, evidenceId: 'time_restricted_eating' };
  }
  const str = linearTrend(inWindow(strengthSeries(state), addDays(today, -27), today), 0.3);
  if (str && str.direction === 'down') { penalties++; reasons.push('Performances en baisse.'); }
  const meals = inWindow(state.meals, addDays(today, -13), today);
  if (proteinTargetG && meals.length >= 5) {
    const logged = meals.map((m) => m.proteinG).filter((x): x is number => typeof x === 'number');
    if (logged.length >= 5 && mean(logged) < proteinTargetG * 0.85) { penalties++; reasons.push('Cible protéique pas atteinte : une fenêtre courte la rend plus difficile.'); }
  }
  if (state.profile.trainingTimeOfDay === 'morning') reasons.push('Entraînement le matin : une fenêtre 16/8 placerait la séance à jeun ; préférer 12/12 ou 14/10.');

  if (penalties === 0) {
    reasons.unshift('Faim, énergie, sommeil et performance sont stables : une fenêtre 14/10 ou 16/8 est envisageable si tu l’apprécies. Elle n’apportera pas de résultat supérieur à apports égaux.');
    return { verdict: 'ok', suggestedWindow: state.profile.trainingTimeOfDay === 'morning' ? '14/10' : '16/8', reasons, evidenceId: 'time_restricted_eating' };
  }
  if (penalties === 1) {
    reasons.unshift('Un signal est défavorable : si tu veux essayer, commence par 12/12 et observe la faim et la performance.');
    return { verdict: 'caution', suggestedWindow: '12/12', reasons, evidenceId: 'time_restricted_eating' };
  }
  reasons.unshift('Plusieurs signaux sont défavorables : le jeûne dégraderait probablement ton adhérence ou tes séances. On n’en a pas besoin pour ta recomposition.');
  return { verdict: 'not_recommended', suggestedWindow: null, reasons, evidenceId: 'time_restricted_eating' };
}
