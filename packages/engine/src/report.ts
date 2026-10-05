import type { ISODate, UserState } from './types';
import { addDays, inWindow, linearTrend, mean, round } from './stats';
import { checkinsIn, sessionAdherence, strengthSeries, waistSeries, weightRolling } from './scores';
import { computeBodyCompositionScore, computeVitalityScore } from './scores';

export interface ReportSection {
  key: 'transformation' | 'muscle' | 'fat' | 'strength' | 'nutrition' | 'sleep' | 'recovery' | 'vitality' | 'consistency';
  title: string;
  value: string;
  text: string;
}

export interface MonthlyReport {
  from: ISODate;
  to: ISODate;
  title: string;
  sections: ReportSection[];
  learned: string[];
  conclusion: string;
}

/** « Voici ce que nous avons appris sur ton corps ce mois-ci. » */
export function monthlyReport(state: UserState, today: ISODate): MonthlyReport {
  const from = addDays(today, -29);
  const wRoll = inWindow(weightRolling(state), from, today);
  const wTrend = linearTrend(wRoll, 0.05);
  const waist = inWindow(waistSeries(state), from, today);
  const waistDelta = waist.length >= 2 ? round(waist[waist.length - 1]!.value - waist[0]!.value, 1) : null;
  const str = linearTrend(inWindow(strengthSeries(state), from, today), 0.2);
  const adh = sessionAdherence(state, from, today);
  const cks = checkinsIn(state, from, today);
  const sleep = cks.length ? round(mean(cks.map((c) => c.sleepHours)), 1) : null;
  const energy = cks.length ? round(mean(cks.map((c) => c.energy)), 1) : null;
  const soreness = cks.length ? round(mean(cks.map((c) => c.soreness)), 1) : null;
  const meals = inWindow(state.meals, from, today);
  const bcs = computeBodyCompositionScore(state, today);
  const vit = computeVitalityScore(state, today);
  const sessionsDone = inWindow(state.sessions, from, today).filter((s) => s.completed).length;

  const sections: ReportSection[] = [];
  sections.push({ key: 'transformation', title: 'Transformation', value: `${bcs.score}/100`, text: bcs.headline });
  sections.push({ key: 'fat', title: 'Graisse', value: waistDelta === null ? '—' : `${waistDelta > 0 ? '+' : ''}${waistDelta} cm`, text: waistDelta === null ? 'Pas assez de mesures de tour de taille ce mois-ci.' : waistDelta <= -1 ? `Tour de taille en baisse de ${Math.abs(waistDelta)} cm : la graisse abdominale recule.` : waistDelta >= 1 ? 'Tour de taille en hausse : à mettre en regard du poids et de la force.' : 'Tour de taille stable.' });
  sections.push({ key: 'muscle', title: 'Muscle', value: wTrend ? `${wTrend.delta > 0 ? '+' : ''}${wTrend.delta} kg` : '—', text: wTrend ? (Math.abs(wTrend.delta) < 1 && (waistDelta ?? 0) < 0 ? 'Poids quasi stable avec taille en baisse : la masse maigre est au minimum préservée, probablement en hausse.' : wTrend.delta < -2 ? 'Poids en baisse marquée : on surveille la force pour s’assurer que le muscle est protégé.' : 'Évolution du poids modérée.') : 'Pas assez de pesées.' });
  sections.push({ key: 'strength', title: 'Force', value: str ? `${str.delta > 0 ? '+' : ''}${round(str.delta, 1)} %` : '—', text: str ? (str.delta >= 2 ? 'Progression nette sur tes mouvements clés.' : str.delta <= -2 ? 'Baisse de force : récupération ou déficit à revoir.' : 'Force stable.') : 'Pas de performances enregistrées.' });
  sections.push({ key: 'nutrition', title: 'Nutrition', value: `${meals.length} repas suivis`, text: meals.length >= 20 ? 'Suivi régulier : le moteur peut ajuster finement.' : meals.length >= 8 ? 'Suivi partiel : suffisant pour les tendances.' : 'Peu de repas suivis : les cibles restent des estimations.' });
  sections.push({ key: 'sleep', title: 'Sommeil', value: sleep === null ? '—' : `${sleep} h`, text: sleep === null ? '' : sleep >= 7 ? 'Durée suffisante pour soutenir la recomposition.' : 'Sommeil court : premier levier à travailler le mois prochain.' });
  sections.push({ key: 'recovery', title: 'Récupération', value: soreness === null ? '—' : `${soreness}/5 courbatures`, text: soreness === null ? '' : soreness <= 2.5 ? 'Charge bien tolérée.' : 'Courbatures élevées : volume ou sommeil à ajuster.' });
  sections.push({ key: 'vitality', title: 'Vitalité', value: `${vit.score}/10`, text: vit.headline });
  sections.push({ key: 'consistency', title: 'Constance', value: adh === null ? `${sessionsDone} séances` : `${Math.round(adh * 100)} %`, text: adh !== null && adh >= 0.8 ? `${sessionsDone} séances réalisées. La régularité est ton meilleur atout.` : 'Des séances ont sauté : c’est la priorité du mois prochain, avant tout réglage nutritionnel.' });

  const learned: string[] = [];
  if (wTrend && Math.abs(wTrend.delta) < 1 && (waistDelta ?? 0) <= -1) learned.push('Ton corps se recompose à poids stable : la balance ne te dira rien d’utile pendant cette phase.');
  if (str && str.delta >= 2 && (energy ?? 3) >= 3) learned.push('Tu progresses en force avec ce niveau d’apports : le déficit actuel est bien toléré.');
  if (sleep !== null && sleep < 6.5) learned.push('Ton sommeil est le facteur limitant le plus probable ce mois-ci.');
  if (cks.length) {
    const hunger = mean(cks.map((c) => c.hunger));
    learned.push(hunger >= 3.5 ? 'Ta faim est élevée : les jours riches en fibres et protéines sont ceux où tu la ressens le moins.' : 'Ta faim reste maîtrisée avec cette structure de repas.');
  }
  if (adh !== null && adh >= 0.85) learned.push(`${state.profile.sessionsPerWeek} séances par semaine est un rythme que tu tiens réellement. C’est ta base.`);
  if (learned.length === 0) learned.push('Encore peu de données : le mois prochain, le rapport sera plus précis.');

  const conclusion = bcs.trend === 'improving' ? 'La stratégie fonctionne. On la garde telle quelle le mois prochain et on refait les photos.' : bcs.trend === 'worsening' ? 'Plusieurs signaux reculent : on simplifie, on sécurise les séances et le sommeil, et on réévalue dans deux semaines.' : 'Stabilité : ce n’est pas un échec. On ajuste un seul levier si le plateau se confirme.';
  return { from, to: today, title: 'Your Body Report', sections, learned, conclusion };
}
