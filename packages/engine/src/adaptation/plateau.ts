import type { ISODate, UserState } from '../types';
import { addDays, inWindow, linearTrend } from '../stats';
import { sessionAdherence, strengthSeries, waistSeries, weightRolling } from '../scores';

export interface PlateauResult {
  kind: 'true_plateau' | 'pseudo_plateau' | 'progressing' | 'insufficient_data';
  reasons: string[];
  signals: { weightPctPerWeek: number | null; waistDeltaCm: number | null; strengthSlope: number | null; adherence: number | null; days: number };
  recommendation: string;
}

/**
 * Un vrai plateau exige : ≥ 21 jours, poids plat (<0,15 %/sem), taille plate (|Δ| < 0,5 cm),
 * force plate, adhérence ≥ 80 %. Sinon : pseudo-plateau (cause probable) ou progression.
 */
export function detectPlateau(state: UserState, today: ISODate): PlateauResult {
  const from = addDays(today, -27);
  const w = linearTrend(inWindow(weightRolling(state), from, today), 0.0001);
  const wa = linearTrend(inWindow(waistSeries(state), from, today), 0.0001);
  const st = linearTrend(inWindow(strengthSeries(state), from, today), 0.0001);
  const adh = sessionAdherence(state, from, today);
  const days = w ? Math.round((Date.parse(today) - Date.parse(inWindow(weightRolling(state), from, today)[0]?.date ?? today)) / 86_400_000) : 0;
  const weightPct = w ? (w.slopePerWeek / w.first) * 100 : null;
  const signals = { weightPctPerWeek: weightPct === null ? null : Math.round(weightPct * 100) / 100, waistDeltaCm: wa ? wa.delta : null, strengthSlope: st ? st.slopePerWeek : null, adherence: adh, days };
  const reasons: string[] = [];

  if (!w || w.points < 10 || days < 21) {
    return { kind: 'insufficient_data', reasons: ['Moins de 3 semaines de données : trop tôt pour parler de plateau. Le poids seul fluctue de 1 à 2 kg.'], signals, recommendation: 'Continue à mesurer. Décision au plus tôt dans ' + Math.max(0, 21 - days) + ' jours.' };
  }
  const weightFlat = Math.abs(weightPct ?? 0) < 0.15;
  const waistFlat = wa ? Math.abs(wa.delta) < 0.5 : true;
  const strengthFlat = st ? Math.abs(st.slopePerWeek) < 0.3 : true;
  const waistDown = wa ? wa.delta <= -0.5 : false;
  const strengthUp = st ? st.slopePerWeek >= 0.3 : false;

  if (waistDown || strengthUp) {
    if (waistDown) reasons.push(`Tour de taille ${wa!.delta} cm sur la période.`);
    if (strengthUp) reasons.push('Force en progression.');
    if (weightFlat) reasons.push('Poids stable : en recomposition, c’est attendu.');
    return { kind: 'progressing', reasons, signals, recommendation: 'Ce n’est pas un plateau. Le poids ne bouge pas mais la composition change. Ne change rien.' };
  }
  if (weightFlat && waistFlat && strengthFlat) {
    if (adh !== null && adh < 0.8) {
      reasons.push(`Adhérence ${Math.round(adh * 100)} % : avant de parler de plateau, on sécurise les séances.`);
      return { kind: 'pseudo_plateau', reasons, signals, recommendation: 'Pas de changement de plan : objectif de la semaine = toutes les séances prévues. On réévalue dans 2 semaines.' };
    }
    const mealsLogged = inWindow(state.meals, from, today).length;
    if (mealsLogged < 10) reasons.push('Peu de repas enregistrés : l’apport réel est probablement différent de la cible (c’est la cause n°1 des plateaux).');
    reasons.push('Poids, tour de taille et force stables sur 3–4 semaines avec une bonne adhérence.');
    return { kind: 'true_plateau', reasons, signals, recommendation: 'Un seul ajustement à la fois : −5 à −8 % d’énergie les jours de repos OU +1 500 pas/jour. Puis 2 semaines d’observation.' };
  }
  reasons.push('Signaux mixtes : pas un plateau au sens strict.');
  return { kind: 'pseudo_plateau', reasons, signals, recommendation: 'On ne change rien de structurel. On vérifie protocole de mesure, sommeil et adhérence.' };
}
