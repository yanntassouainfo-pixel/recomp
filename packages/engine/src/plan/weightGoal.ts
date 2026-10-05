import type { EvidenceId, ISODate, Profile } from '../types';
import { addDays, round } from '../stats';

export interface WeightGoalAssessment {
  targetKg: number;
  currentKg: number;
  deltaKg: number; // négatif = perdre
  direction: 'lose' | 'gain' | 'hold';
  /** rythme sûr retenu (% du poids / semaine) */
  ratePctPerWeek: number;
  weeks: number;
  etaDate: ISODate;
  bmiTarget: number;
  safe: boolean;
  message: string;
  evidenceId: EvidenceId;
}

/**
 * Un objectif de poids est un repère, pas une sentence. On le traduit en durée réaliste
 * (≤ 0,6 %/semaine en perte, ≤ 0,3 %/semaine en prise) et on refuse les cibles sous un IMC de 18,5.
 */
export function assessWeightGoal(profile: Profile, currentKg: number, today: ISODate): WeightGoalAssessment | null {
  const target = profile.targetWeightKg;
  if (!target || !Number.isFinite(target) || target <= 0) return null;
  const h = profile.heightCm / 100;
  const bmiTarget = round(target / (h * h), 1);
  currentKg = round(currentKg, 1);
  const delta = round(target - currentKg, 1);
  const direction: WeightGoalAssessment['direction'] = Math.abs(delta) < 0.5 ? 'hold' : delta < 0 ? 'lose' : 'gain';
  const safe = bmiTarget >= 18.5 && bmiTarget <= 40;
  const rate = direction === 'lose' ? 0.6 : direction === 'gain' ? 0.3 : 0;
  // itération : la perte est un % du poids courant qui diminue
  let w = currentKg;
  let weeks = 0;
  if (direction !== 'hold') {
    while ((direction === 'lose' ? w > target : w < target) && weeks < 200) {
      w = direction === 'lose' ? w * (1 - rate / 100) : w * (1 + rate / 100);
      weeks++;
    }
  }
  const etaDate = addDays(today, weeks * 7);
  let message: string;
  if (!safe && bmiTarget < 18.5) {
    message = `Cet objectif correspondrait à un IMC de ${bmiTarget}, sous le seuil de 18,5. Le coach ne programme pas de déficit vers ce poids ; si c’est un besoin de santé, parles-en à un médecin.`;
  } else if (direction === 'hold') {
    message = `Tu es déjà à ton poids cible. L’objectif devient la composition : moins de gras, plus de muscle, à poids stable.`;
  } else if (direction === 'lose') {
    message = `De ${currentKg} à ${target} kg (${delta} kg) à un rythme ≤ ${rate} %/semaine, qui préserve le muscle : environ ${weeks} semaines. Si ta force baisse ou ton énergie s’effondre, on ralentit, même si la balance « va bien ».`;
  } else {
    message = `De ${currentKg} à ${target} kg (+${delta} kg) à un rythme ≤ ${rate} %/semaine pour que la prise soit surtout musculaire : environ ${weeks} semaines. Le tour de taille reste sous surveillance.`;
  }
  return { targetKg: target, currentKg, deltaKg: delta, direction, ratePctPerWeek: rate, weeks, etaDate, bmiTarget, safe, message, evidenceId: 'deficit_rate' };
}
