import type { Explanation, ISODate, LifeEventType, Profile, UserState } from '../types';
import { addDays, clamp, inWindow, mean, round } from '../stats';
import { weightRolling } from '../scores';

export type DayType = 'training' | 'rest';

export interface NutritionModifiers {
  highHunger?: boolean;
  lowEnergy?: boolean;
  poorSleep?: boolean;
  lifeEvent?: LifeEventType | null;
  /** réduction/augmentation supplémentaire décidée par la revue hebdo (ex. -0.05) */
  reviewAdjustment?: number;
}

export interface SimplePortions {
  proteinPalms: number;
  carbFists: number;
  vegFists: number;
  fatThumbs: number;
  waterGlasses: number;
}

export interface NutritionTargets {
  dayType: DayType;
  tdee: number;
  kcal: number;
  energyDeltaPct: number; // ex. -0.12
  proteinG: number;
  proteinPerKg: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  waterMl: number;
  strategy: string;
  notes: string[];
  explanation: Explanation;
  simple: SimplePortions;
  /** vrai si le profil est à risque : pas de déficit, pas d'affichage calorique agressif */
  safeMode: boolean;
}

export function currentWeight(state: UserState, today: ISODate): number {
  const roll = weightRolling(state).filter((p) => p.date <= today);
  const l = roll[roll.length - 1];
  return l ? l.value : state.profile.startWeightKg;
}

export function averageSteps(state: UserState, today: ISODate): number | undefined {
  const cks = inWindow(state.checkins, addDays(today, -13), today);
  const steps = cks.map((c) => c.steps).filter((s): s is number => typeof s === 'number');
  if (steps.length) return mean(steps);
  return state.profile.stepsPerDay;
}

/** Mifflin-St Jeor. */
export function bmr(profile: Profile, weightKg: number): number {
  const base = 10 * weightKg + 6.25 * profile.heightCm - 5 * profile.age;
  return profile.sex === 'female' ? base - 161 : profile.sex === 'male' ? base + 5 : base - 78;
}

/**
 * Dépense estimée. Point de départ ±10 %, corrigé ensuite par les tendances réelles.
 * Base sédentaire ×1,2 + supplément profession + pas + coût de la séance.
 */
export function estimateTDEE(profile: Profile, weightKg: number, steps: number | undefined, dayType: DayType): number {
  const b = bmr(profile, weightKg);
  const occupationExtra = { sedentary: 0, light: 0.1, active: 0.25, very_active: 0.4 }[profile.occupation];
  const stepKcal = steps !== undefined ? steps * 0.0004 * weightKg : 0.0004 * weightKg * 5000;
  const sessionKcal = dayType === 'training' ? profile.sessionMinutes * 6 * (weightKg / 80) : 0;
  return Math.round(b * (1.2 + occupationExtra) + stepKcal + sessionKcal);
}

export function isSafeMode(profile: Profile): boolean {
  return Boolean(profile.risk.pregnant || profile.risk.minor || profile.risk.eatingDisorderHistory);
}

export function computeNutritionTargets(state: UserState, today: ISODate, dayType: DayType, mods: NutritionModifiers = {}): NutritionTargets {
  const p = state.profile;
  const w = currentWeight(state, today);
  const steps = averageSteps(state, today);
  const tdee = estimateTDEE(p, w, steps, dayType);
  const safeMode = isSafeMode(p);
  const notes: string[] = [];

  // --- stratégie énergétique ---
  let delta = 0;
  let strategy = 'Maintenance';
  const goal = p.primaryGoal;
  if (safeMode) {
    delta = 0;
    strategy = 'Accompagnement sans déficit';
    notes.push('Profil nécessitant de la prudence : aucune restriction énergétique proposée. Un professionnel de santé reste la référence.');
  } else if (goal === 'recomposition' || goal === 'definition' || goal === 'athletic') {
    delta = dayType === 'training' ? 0 : -0.12;
    strategy = dayType === 'training' ? 'Recomposition — jour d’entraînement : maintenance' : 'Recomposition — jour de repos : déficit léger';
  } else if (goal === 'fat_loss') {
    delta = -0.18;
    strategy = 'Perte de gras — déficit modéré';
  } else if (goal === 'muscle_gain') {
    delta = 0.08;
    strategy = 'Construction — léger surplus';
  } else if (goal === 'strength') {
    delta = 0.03;
    strategy = 'Force — maintenance haute';
  } else {
    delta = 0;
    strategy = 'Santé / énergie — maintenance';
  }

  // --- modificateurs ---
  if (!safeMode && (mods.lowEnergy || mods.poorSleep) && delta < 0) {
    delta = delta / 2;
    notes.push(mods.poorSleep ? 'Sommeil dégradé : déficit réduit de moitié aujourd’hui, on protège la récupération avant les calories.' : 'Énergie basse : déficit réduit de moitié aujourd’hui.');
  }
  if (mods.reviewAdjustment && !safeMode) {
    delta += mods.reviewAdjustment;
    notes.push(`Ajustement décidé lors de ta revue hebdomadaire : ${mods.reviewAdjustment > 0 ? '+' : ''}${Math.round(mods.reviewAdjustment * 100)} %.`);
  }
  if (mods.lifeEvent === 'illness') {
    delta = Math.max(delta, 0);
    notes.push('Maladie : maintenance, protéines et hydratation. Le déficit attendra.');
  }
  if (mods.lifeEvent === 'restaurant' || mods.lifeEvent === 'birthday') {
    notes.push('Repas libre prévu : protéines d’abord, profite, et demain on reprend simplement le rythme normal. Aucune compensation.');
  }

  // plafond de déficit : ≤ 0,7 % du poids / semaine ≈ (0.007 × w × 7700) / 7 kcal/j
  const maxDeficitKcal = (0.007 * w * 7700) / 7;
  let kcal = Math.round(tdee * (1 + delta));
  if (tdee - kcal > maxDeficitKcal) {
    kcal = Math.round(tdee - maxDeficitKcal);
    notes.push('Déficit plafonné pour rester sous 0,7 % du poids par semaine et préserver le muscle.');
  }
  // plancher de sécurité
  const floor = p.sex === 'female' ? 1300 : 1600;
  if (kcal < floor) {
    kcal = floor;
    notes.push('Plancher énergétique appliqué.');
  }

  // --- protéines ---
  let perKg = 1.6;
  // Toute stratégie impliquant un déficit (même cyclé) garde 2 g/kg tous les jours : le muscle ne connaît pas le calendrier.
  if (delta < -0.05 || goal === 'recomposition' || goal === 'definition' || goal === 'athletic') perKg = 2.0;
  if (goal === 'fat_loss') perKg = 2.2;
  if (goal === 'muscle_gain' || goal === 'strength') perKg = 1.8;
  if (p.age >= 50) perKg += 0.2;
  if (mods.highHunger) perKg = Math.max(perKg, 2.0);
  perKg = clamp(perKg, 1.6, 2.4);
  const proteinG = Math.round(perKg * w);

  // --- lipides & glucides ---
  let fatG = Math.round(Math.max(0.8 * w, (kcal * 0.25) / 9));
  let carbsG = Math.round((kcal - proteinG * 4 - fatG * 9) / 4);
  const minCarbs = Math.round((dayType === 'training' ? 2.0 : 1.2) * w);
  if (carbsG < minCarbs) {
    fatG = Math.max(Math.round(0.7 * w), Math.round((kcal - proteinG * 4 - minCarbs * 4) / 9));
    carbsG = Math.round((kcal - proteinG * 4 - fatG * 9) / 4);
  }
  carbsG = Math.max(carbsG, 80);
  const fiberG = Math.min(40, Math.round((kcal / 1000) * 14));
  const waterMl = Math.round((35 * w + (dayType === 'training' ? 500 : 0)) / 50) * 50;

  if (mods.highHunger) notes.push('Faim élevée : plus de volume (légumes, légumineuses), protéines au haut de la fourchette, glucides conservés au dîner.');
  if (dayType === 'training') notes.push('Jour d’entraînement : la majorité des glucides autour de la séance.');

  const explanation: Explanation =
    delta < 0
      ? {
          context: `Ta dépense estimée est d’environ ${tdee} kcal aujourd’hui (${dayType === 'training' ? 'avec' : 'sans'} séance).`,
          logic: `Un déficit léger (${Math.round(delta * 100)} %) avec ${perKg} g/kg de protéines permet de perdre du gras en préservant le muscle. Les jours d’entraînement restent à maintenance pour la qualité des séances.`,
          expectedBenefit: 'Tour de taille en baisse lente, force maintenue ou en hausse, énergie stable.',
          evidenceId: 'recomposition_feasibility',
        }
      : {
          context: `Ta dépense estimée est d’environ ${tdee} kcal aujourd’hui.`,
          logic: delta > 0 ? 'Léger surplus pour soutenir la construction musculaire sans accumuler de gras inutilement.' : 'Maintenance : l’objectif du jour est la qualité de la séance et la récupération, pas le déficit.',
          expectedBenefit: delta > 0 ? 'Progression de force et de volume musculaire, prise de poids lente (≤ 0,5 %/semaine).' : 'Bonne séance, récupération, poids stable.',
          evidenceId: delta > 0 ? 'volume_hypertrophy' : 'calorie_cycling',
        };

  const simple: SimplePortions = {
    proteinPalms: Math.max(3, Math.round(proteinG / 28)),
    carbFists: Math.max(1, Math.round(carbsG / 35)),
    vegFists: dayType === 'training' ? 4 : 5,
    fatThumbs: Math.max(2, Math.round(fatG / 10)),
    waterGlasses: Math.round(waterMl / 250),
  };

  return {
    dayType,
    tdee,
    kcal,
    energyDeltaPct: round(delta, 3),
    proteinG,
    proteinPerKg: round(perKg, 1),
    carbsG,
    fatG,
    fiberG,
    waterMl,
    strategy,
    notes,
    explanation,
    simple,
    safeMode,
  };
}
