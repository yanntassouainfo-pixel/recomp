import type { EvidenceId, ISODate, UserState } from '../types';
import { addDays, clamp, inWindow, linearTrend, round } from '../stats';
import { sessionAdherence, strengthDelta28d, waistDelta28d, waistSeries, weightRolling } from '../scores';
import { phasesFor, type PlanPhase } from './periodization';
import { assessWeightGoal } from './weightGoal';
import { currentWeight } from '../nutrition/targets';

export interface ProjectionPoint {
  date: ISODate;
  weekIndex: number;
  waistCm: number;
  weightKg: number;
  weightLow: number;
  weightHigh: number;
  strengthIdx: number;
}

export interface ProjectionBlock {
  index: number;
  startDate: ISODate;
  endDate: ISODate;
  name: string;
  phases: { name: string; weeks: number; intent: PlanPhase['intent'] }[];
  focus: string;
}

export interface ProjectionMilestone {
  date: ISODate;
  label: string;
  kind: 'photos' | 'report' | 'block' | 'goal' | 'maintenance';
}

export interface LongTermProjection {
  horizonMonths: number;
  scenario: 'current' | 'consistent';
  adherenceAssumed: number;
  points: ProjectionPoint[];
  blocks: ProjectionBlock[];
  milestones: ProjectionMilestone[];
  summary: { waistDeltaCm: number; weightDeltaKg: number; strengthDeltaPct: number; weightAt: number; waistAt: number };
  narrative: string[];
  caveats: string[];
  evidenceId: EvidenceId;
}

/** Rythmes de référence par semaine selon la stratégie, avant correction par l'adhérence et la décroissance. */
function baseRates(state: UserState, today: ISODate): { waistPerWeek: number; weightPerWeek: number; strengthPerWeek: number } {
  const g = state.profile.primaryGoal;
  const level = state.profile.level;
  const strengthBase = level === 'beginner' ? 1.2 : level === 'intermediate' ? 0.6 : 0.3; // % / semaine, décroissant
  // Observé sur 28 jours quand disponible, sinon valeur de référence prudente
  const wd = waistDelta28d(state, today);
  const wTrend = linearTrend(inWindow(weightRolling(state), addDays(today, -27), today), 0.0001);
  const observedWaist = wd !== null ? wd / 4 : null;
  const observedWeight = wTrend && wTrend.points >= 10 ? wTrend.slopePerWeek : null;
  const ref = g === 'fat_loss' ? { waist: -0.5, weight: -0.45 } : g === 'muscle_gain' ? { waist: 0.05, weight: 0.25 } : g === 'recomposition' || g === 'definition' || g === 'athletic' ? { waist: -0.35, weight: -0.1 } : { waist: -0.15, weight: 0 };
  // moyenne pondérée observé / référence (l'observé pèse plus quand il existe)
  // Perte de gras / prise de muscle avec objectif : la stratégie est délibérée, la référence pèse plus que l'historique
  const deliberate = g === 'fat_loss' || g === 'muscle_gain';
  const wObs = deliberate ? 0.3 : 0.6;
  const waistPerWeek = observedWaist !== null ? clamp(wObs * observedWaist + (1 - wObs) * ref.waist, -1.2, 0.3) : ref.waist;
  const weightPerWeek = observedWeight !== null ? clamp(wObs * observedWeight + (1 - wObs) * ref.weight, -0.9, 0.5) : ref.weight;
  const sd = strengthDelta28d(state, today);
  const strengthPerWeek = sd && sd.points >= 3 ? clamp(0.6 * (sd.delta / 4) + 0.4 * strengthBase, -0.5, 2) : strengthBase;
  return { waistPerWeek, weightPerWeek, strengthPerWeek };
}

/**
 * Projection prudente sur 6 ou 12 mois. Les rythmes décroissent avec le temps (rendements décroissants),
 * sont modulés par l'adhérence supposée et neutralisés pendant les semaines de maintenance (allégée, pause diète, consolidation).
 * Ce n'est pas une promesse : un couloir, avec une fourchette de poids.
 */
export function projectLongTerm(state: UserState, today: ISODate, horizonMonths: 6 | 12 = 6, scenario: 'current' | 'consistent' = 'current'): LongTermProjection {
  const p = state.profile;
  const weeks = horizonMonths === 6 ? 26 : 52;
  const observedAdh = sessionAdherence(state, addDays(today, -27), today);
  const adherence = scenario === 'consistent' ? 0.9 : clamp(observedAdh ?? 0.75, 0.4, 1);
  const rates = baseRates(state, today);
  const w0 = currentWeight(state, today);
  const ws = waistSeries(state);
  const waist0 = ws.length ? ws[ws.length - 1]!.value : p.sex === 'female' ? 80 : 90;
  const goal = assessWeightGoal(p, w0, today);

  // Blocs successifs de 12 semaines : le bloc courant puis des blocs de même nature, avec consolidation
  const phases = phasesFor(p);
  const blockWeeks = phases.reduce((a, x) => a + x.weeks, 0);
  const blocks: ProjectionBlock[] = [];
  const milestones: ProjectionMilestone[] = [];
  const nBlocks = Math.ceil(weeks / blockWeeks);
  const blockName = (i: number) => (p.primaryGoal === 'fat_loss' ? (goal && goal.direction === 'lose' && i > 0 && i % 3 === 2 ? 'Maintenance planifiée' : `Bloc perte de gras ${i + 1}`) : p.primaryGoal === 'muscle_gain' ? `Bloc construction ${i + 1}` : p.primaryGoal === 'strength' ? `Bloc force ${i + 1}` : `Bloc recomposition ${i + 1}`);
  // semaine → mode (plan / maintenance) pour moduler les rythmes
  const weekMode: ('plan' | 'maintenance')[] = [];
  for (let b = 0; b < nBlocks; b++) {
    const start = addDays(today, b * blockWeeks * 7);
    const name = blockName(b);
    const maintenanceBlock = name.startsWith('Maintenance');
    blocks.push({ index: b + 1, startDate: start, endDate: addDays(start, blockWeeks * 7 - 1), name, phases: phases.map((x) => ({ name: x.name, weeks: x.weeks, intent: x.intent })), focus: maintenanceBlock ? 'Stabiliser le nouveau poids, garder la force, souffler.' : phases[1]?.focus ?? '' });
    milestones.push({ date: start, label: name, kind: maintenanceBlock ? 'maintenance' : 'block' });
    for (const ph of phases) for (let k = 0; k < ph.weeks; k++) weekMode.push(maintenanceBlock || ph.nutritionMode === 'maintenance' ? 'maintenance' : 'plan');
    milestones.push({ date: addDays(start, blockWeeks * 7 - 1), label: `Photos et rapport (bloc ${b + 1})`, kind: 'report' });
  }

  const points: ProjectionPoint[] = [];
  let waist = waist0, weight = w0, strength = 100;
  let band = 0;
  for (let k = 0; k <= weeks; k++) {
    if (k > 0) {
      const decay = Math.exp(-k / (horizonMonths === 6 ? 40 : 60)); // rendements décroissants
      const mode = weekMode[k - 1] ?? 'plan';
      const eff = adherence * (0.6 + 0.4 * decay);
      const dw = mode === 'maintenance' ? 0 : rates.waistPerWeek * eff;
      const dW = mode === 'maintenance' ? (rates.weightPerWeek < 0 ? 0.05 : 0) : rates.weightPerWeek * eff;
      const dS = rates.strengthPerWeek * (mode === 'maintenance' ? 0.3 : 1) * adherence * decay;
      waist = Math.max(waist0 - 20, waist + dw);
      weight = weight + dW;
      strength = strength + dS;
      band = Math.min(3.5, band + 0.12);
      // objectif de poids atteint → maintenance
      if (goal && goal.safe && goal.direction === 'lose' && weight <= goal.targetKg) { weight = goal.targetKg; }
      if (goal && goal.safe && goal.direction === 'gain' && weight >= goal.targetKg) { weight = goal.targetKg; }
    }
    points.push({ date: addDays(today, k * 7), weekIndex: k, waistCm: round(waist, 1), weightKg: round(weight, 1), weightLow: round(weight - band, 1), weightHigh: round(weight + band, 1), strengthIdx: round(strength, 1) });
  }
  if (goal && goal.safe && goal.direction !== 'hold') {
    const hit = points.find((pt) => (goal.direction === 'lose' ? pt.weightKg <= goal.targetKg : pt.weightKg >= goal.targetKg));
    if (hit) milestones.push({ date: hit.date, label: `Objectif ${goal.targetKg} kg atteint (estimation)`, kind: 'goal' });
  }
  milestones.sort((a, b) => (a.date < b.date ? -1 : 1));

  const last = points[points.length - 1]!;
  const summary = { waistDeltaCm: round(last.waistCm - waist0, 1), weightDeltaKg: round(last.weightKg - w0, 1), strengthDeltaPct: round(last.strengthIdx - 100, 0), weightAt: last.weightKg, waistAt: last.waistCm };

  const months = horizonMonths;
  const narrative: string[] = [];
  if (summary.waistDeltaCm <= -2) narrative.push(`Dans ${months} mois, à ce rythme, ton tour de taille serait autour de ${summary.waistAt} cm (${summary.waistDeltaCm} cm). C’est la graisse abdominale qui recule, même si la balance bouge peu.`);
  else narrative.push(`Dans ${months} mois, ton tour de taille serait autour de ${summary.waistAt} cm : stable, ce qui est cohérent avec ton objectif.`);
  if (Math.abs(summary.weightDeltaKg) < 1.5) narrative.push(`Ton poids resterait proche de ${summary.weightAt} kg (fourchette ${last.weightLow}–${last.weightHigh}). Le changement se verra dans le miroir et sur le ruban, pas sur la balance.`);
  else narrative.push(`Ton poids irait vers ${summary.weightAt} kg (fourchette ${last.weightLow}–${last.weightHigh}), soit ${summary.weightDeltaKg > 0 ? '+' : ''}${summary.weightDeltaKg} kg, à un rythme qui préserve le muscle.`);
  narrative.push(`Ta force progresserait d’environ ${summary.strengthDeltaPct > 0 ? '+' : ''}${summary.strengthDeltaPct} % sur tes mouvements clés, plus vite au début puis par paliers.`);
  narrative.push(scenario === 'consistent' ? 'Scénario « régulier » : 90 % des séances tenues.' : `Scénario « comme maintenant » : ${Math.round(adherence * 100)} % des séances tenues, c’est ton rythme réel des 4 dernières semaines.`);
  const caveats = [
    'Projection, pas promesse : les rythmes réels varient d’une personne à l’autre et ralentissent avec le temps. Le moteur recalibre chaque semaine sur tes données.',
    'Les semaines allégées, pauses diète et consolidations sont déjà intégrées : ce sont les plateaux volontaires du couloir.',
    'Un tour de taille se mesure à l’ombilic, à jeun ; un poids se lit en moyenne 7 jours.',
  ];
  return { horizonMonths, scenario, adherenceAssumed: round(adherence, 2), points, blocks, milestones, summary, narrative, caveats, evidenceId: 'deficit_rate' };
}
