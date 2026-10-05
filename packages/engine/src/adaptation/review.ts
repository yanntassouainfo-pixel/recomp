import type { EvidenceId, ISODate, UserState } from '../types';
import { addDays, inWindow, linearTrend, mean, round } from '../stats';
import { checkinsIn, sessionAdherence, strengthDelta28d, waistDelta28d, weightRolling } from '../scores';
import { detectPlateau } from './plateau';

export interface ReviewItem {
  text: string;
  why: string;
  evidenceId?: EvidenceId;
}

export interface WeeklyReview {
  from: ISODate;
  to: ISODate;
  headline: string;
  metrics: {
    weightAvg: number | null;
    weightDelta: number | null;
    waistDelta: number | null;
    strengthDeltaPct: number | null;
    adherence: number | null;
    sleepAvg: number | null;
    energyAvg: number | null;
    hungerAvg: number | null;
  };
  works: ReviewItem[];
  blocks: ReviewItem[];
  change: ReviewItem[];
  keep: ReviewItem[];
  /** ajustement énergétique à appliquer la semaine suivante (ex. -0.05), 0 si rien */
  energyAdjustment: number;
  decisionWindowOk: boolean;
}

export function weeklyReview(state: UserState, today: ISODate): WeeklyReview {
  const to = today;
  const from = addDays(today, -6);
  const prevFrom = addDays(today, -13);
  const win28 = addDays(today, -27);

  const wRoll = weightRolling(state);
  const wThis = inWindow(wRoll, from, to);
  const wPrev = inWindow(wRoll, prevFrom, addDays(from, -1));
  const weightAvg = wThis.length ? round(mean(wThis.map((p) => p.value)), 1) : null;
  const weightDelta = wThis.length && wPrev.length ? round(mean(wThis.map((p) => p.value)) - mean(wPrev.map((p) => p.value)), 1) : null;

  const waistDelta = waistDelta28d(state, to);
  const strTrend = strengthDelta28d(state, to);
  const strengthDeltaPct = strTrend ? round(strTrend.delta, 1) : null;
  const adherence = sessionAdherence(state, prevFrom, to);
  const cks = checkinsIn(state, prevFrom, to);
  const sleepAvg = cks.length ? round(mean(cks.map((c) => c.sleepHours)), 1) : null;
  const energyAvg = cks.length ? round(mean(cks.map((c) => c.energy)), 1) : null;
  const hungerAvg = cks.length ? round(mean(cks.map((c) => c.hunger)), 1) : null;

  const works: ReviewItem[] = [];
  const blocks: ReviewItem[] = [];
  const change: ReviewItem[] = [];
  const keep: ReviewItem[] = [];
  let energyAdjustment = 0;

  const dataDays = wRoll.filter((p) => p.date <= to && p.date >= win28).length;
  const decisionWindowOk = dataDays >= 14 && (adherence === null || adherence >= 0.7);

  // 1. Sécurité
  const wTrend28 = linearTrend(inWindow(wRoll, addDays(to, -20), to), 0.0001);
  const pctPerWeek = wTrend28 ? (wTrend28.slopePerWeek / wTrend28.first) * 100 : 0;
  if (wTrend28 && wTrend28.points >= 14 && pctPerWeek < -1) {
    blocks.push({ text: `Perte de poids rapide (${round(pctPerWeek, 2)} %/semaine sur 3 semaines).`, why: 'Au-delà de 1 %/semaine, la perte inclut davantage de muscle et de performance. En recomposition, c’est contre-productif.', evidenceId: 'deficit_rate' });
    change.push({ text: 'On remonte les apports à maintenance les jours d’entraînement et on réduit le déficit des jours de repos.', why: 'Protéger la masse maigre vaut plus que 500 g de moins sur la balance.', evidenceId: 'deficit_rate' });
    energyAdjustment = +0.06;
  }
  const painDays = cks.filter((c) => c.pain && c.pain.severity >= 3).length;
  if (painDays >= 3) {
    blocks.push({ text: `Douleur signalée ${painDays} jours sur 14.`, why: 'Une douleur persistante n’est pas une courbature : le coaching ne remplace pas une évaluation.', evidenceId: 'readiness_autoregulation' });
    change.push({ text: 'Les exercices sollicitant la zone sont retirés jusqu’à avis professionnel.', why: 'Continuer sur une douleur persistante allonge la blessure.' });
  }

  // 2. Fenêtre insuffisante
  if (!decisionWindowOk) {
    keep.push({ text: 'Aucun changement de stratégie cette semaine.', why: dataDays < 14 ? `Seulement ${dataDays} jours de données : une décision sur moins de 14 jours réagit au bruit, pas au signal.` : `Adhérence ${Math.round((adherence ?? 0) * 100)} % : avant de régler le plan, on sécurise les séances.`, evidenceId: 'weight_noise' });
    if (adherence !== null && adherence < 0.7) blocks.push({ text: `Séances réalisées : ${Math.round(adherence * 100)} % du plan.`, why: 'La régularité est le premier déterminant du résultat ; c’est le levier n°1 cette semaine.' });
    else works.push({ text: 'Tu construis l’historique qui permettra des décisions fiables.', why: 'Le moteur ne décide qu’avec 14 jours et une adhérence ≥ 70 %.' });
  } else {
    // 3. Recomposition en cours
    const waistDown = waistDelta !== null && waistDelta <= -0.5;
    const strengthUp = strengthDeltaPct !== null && strengthDeltaPct >= 1;
    const strengthDown = strengthDeltaPct !== null && strengthDeltaPct <= -1.5;
    const weightStable = Math.abs(pctPerWeek) < 0.25;
    const energyLow = energyAvg !== null && energyAvg < 2.8;
    const sleepLow = sleepAvg !== null && sleepAvg < 6.5;
    const hungerHigh = hungerAvg !== null && hungerAvg >= 3.6;

    if (waistDown) works.push({ text: `Tour de taille : ${waistDelta} cm sur 4 semaines.`, why: 'C’est le marqueur le plus fiable de la graisse abdominale, indépendamment du poids.', evidenceId: 'waist_marker' });
    if (strengthUp) works.push({ text: `Force : +${strengthDeltaPct} % sur tes mouvements clés.`, why: 'La force qui monte signifie que le muscle est au minimum préservé.', evidenceId: 'progressive_overload' });
    if (adherence !== null && adherence >= 0.8) works.push({ text: `Régularité : ${Math.round(adherence * 100)} % des séances.`, why: 'La constance bat l’intensité sur 6 mois.' });
    if (sleepAvg !== null && sleepAvg >= 7) works.push({ text: `Sommeil : ${sleepAvg} h en moyenne.`, why: 'Le sommeil oriente la perte vers la graisse plutôt que le muscle.', evidenceId: 'sleep_and_fat_loss' });

    if (waistDown && !strengthDown && (weightStable || pctPerWeek < 0)) {
      keep.push({ text: 'Stratégie nutritionnelle et programme inchangés.', why: `Poids ${weightStable ? 'stable' : 'en baisse lente'}, tour de taille en baisse, force ${strengthUp ? 'en hausse' : 'maintenue'} : c’est exactement le type d’évolution que nous recherchons. Changer maintenant serait une erreur.`, evidenceId: 'recomposition_feasibility' });
    }
    if (strengthDown && (energyLow || sleepLow)) {
      blocks.push({ text: 'Force en baisse avec énergie ou sommeil dégradés.', why: 'Signature d’un déficit trop fort ou d’une récupération insuffisante.', evidenceId: 'deficit_rate' });
      change.push({ text: 'Jours d’entraînement à maintenance stricte, séance allégée cette semaine si la fatigue persiste.', why: 'On protège le muscle et la qualité des séances avant la vitesse de perte.', evidenceId: 'calorie_cycling' });
      energyAdjustment = Math.max(energyAdjustment, 0.04);
    }
    if (sleepLow) {
      blocks.push({ text: `Sommeil court (${sleepAvg} h).`, why: 'Sous 6,5 h, la faim augmente et la perte se déplace vers la masse maigre.', evidenceId: 'sleep_and_fat_loss' });
      change.push({ text: 'Priorité de la semaine : heure de coucher régulière (objectif : 5 soirs sur 7 avant l’heure cible).', why: 'Le sommeil est un levier de recomposition, pas un bonus.', evidenceId: 'sleep_and_fat_loss' });
    }
    if (hungerHigh) {
      blocks.push({ text: `Faim élevée (${hungerAvg}/5).`, why: 'Une faim chronique prédit l’abandon. On la traite avant qu’elle ne décide pour toi.', evidenceId: 'fiber' });
      change.push({ text: 'Plus de volume alimentaire : légumes et légumineuses à chaque repas, protéines au haut de la fourchette, glucides conservés au dîner.', why: 'Fibres et protéines augmentent la satiété à calories égales.', evidenceId: 'fiber' });
    }
    const plateau = detectPlateau(state, today);
    if (plateau.kind === 'true_plateau') {
      blocks.push({ text: 'Plateau confirmé : poids, taille et force stables depuis 3–4 semaines avec bonne adhérence.', why: plateau.reasons.join(' '), evidenceId: 'weight_noise' });
      change.push({ text: 'Un seul ajustement : −6 % d’énergie les jours de repos. Rien d’autre ne bouge.', why: 'Un seul changement à la fois pour savoir ce qui a agi.', evidenceId: 'calorie_cycling' });
      energyAdjustment = Math.min(energyAdjustment, -0.06);
    } else if (plateau.kind === 'pseudo_plateau') {
      keep.push({ text: 'Pas d’ajustement calorique.', why: plateau.recommendation, evidenceId: 'weight_noise' });
    }
    if (change.length === 0 && keep.length === 0) {
      keep.push({ text: 'On ne change rien.', why: 'Les signaux sont stables ou en amélioration ; la patience est une stratégie.', evidenceId: 'weight_noise' });
    }
    if (works.length === 0) works.push({ text: 'Tu as tenu le cadre.', why: 'Même une semaine « moyenne » qui respecte la structure fait avancer.' });
  }

  const headline = buildHeadline({ weightDelta, waistDelta, strengthDeltaPct, decisionWindowOk, keep, change });
  return { from, to, headline, metrics: { weightAvg, weightDelta, waistDelta, strengthDeltaPct, adherence, sleepAvg, energyAvg, hungerAvg }, works, blocks, change, keep, energyAdjustment: round(energyAdjustment, 3), decisionWindowOk };
}

function buildHeadline(a: { weightDelta: number | null; waistDelta: number | null; strengthDeltaPct: number | null; decisionWindowOk: boolean; keep: ReviewItem[]; change: ReviewItem[] }): string {
  if (!a.decisionWindowOk) return 'Semaine d’observation : on accumule les données avant de décider.';
  const parts: string[] = [];
  if (a.weightDelta !== null) parts.push(`poids ${a.weightDelta > 0 ? '+' : ''}${a.weightDelta} kg`);
  if (a.waistDelta !== null) parts.push(`tour de taille ${a.waistDelta > 0 ? '+' : ''}${a.waistDelta} cm sur 4 sem.`);
  if (a.strengthDeltaPct !== null) parts.push(`force ${a.strengthDeltaPct > 0 ? '+' : ''}${a.strengthDeltaPct} %`);
  const verdict = a.change.length > 0 ? 'Un ajustement cette semaine.' : 'On ne change rien.';
  return `${parts.join(' · ')}. ${verdict}`;
}
