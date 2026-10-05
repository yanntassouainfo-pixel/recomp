import type { UserState } from '../types';
import type { ComputedState } from '../compute';
import { EVIDENCE } from '../evidence';

/**
 * CONTEXT PACK — la mémoire du coach, compacte, transmise au LLM (ou au coach à règles).
 * L'utilisateur ne doit jamais re-raconter son histoire.
 */
export interface ContextPack {
  profile: Record<string, unknown>;
  today: Record<string, unknown>;
  scores: Record<string, unknown>;
  trends: Record<string, unknown>;
  plan: Record<string, unknown>;
  review: Record<string, unknown>;
  decisions: { date: string; summary: string; why: string }[];
  evidence: { id: string; level: string; title: string; whatWeDo: string }[];
  guardrails: string[];
}

export function buildContextPack(state: UserState, c: ComputedState): ContextPack {
  const p = state.profile;
  const evidenceIds = new Set<string>([c.nutrition.explanation.evidenceId, 'protein_intake', 'weight_noise', 'waist_marker', 'flex_meal_adherence', 'time_restricted_eating', 'photo_bodyfat']);
  for (const it of [...c.review.works, ...c.review.blocks, ...c.review.change, ...c.review.keep]) if (it.evidenceId) evidenceIds.add(it.evidenceId);
  return {
    profile: {
      sex: p.sex, age: p.age, heightCm: p.heightCm, startWeightKg: p.startWeightKg, level: p.level, sessionsPerWeek: p.sessionsPerWeek, sessionMinutes: p.sessionMinutes,
      equipment: p.equipment, occupation: p.occupation, workHoursPerWeek: p.workHoursPerWeek, primaryGoal: p.primaryGoal, goals: p.goals, visualGoals: p.visualGoals, fatStorage: p.fatStorage,
      mode: p.mode, nutritionPrecision: p.nutritionPrecision, foodCultures: p.foodCultures, dietaryPreferences: p.dietaryPreferences, allergies: p.allergies, dislikedFoods: p.dislikedFoods,
      limitations: p.limitations, traits: p.traits, mealsPerDay: p.mealsPerDay, trainingTimeOfDay: p.trainingTimeOfDay, safeMode: c.nutrition.safeMode, priorityStatement: p.priorityStatement,
    },
    today: {
      date: c.today, dayType: c.brief.dayType, checkin: c.checkin, readiness: c.recovery.readiness, lifeEvent: c.lifePlan?.title ?? null,
      workout: c.session ? { title: c.session.title, minutes: c.session.estimatedMinutes, exercises: c.session.exercises.map((e) => `${e.name} ${e.sets}×${e.repMin}-${e.repMax}`) } : null,
    },
    scores: { bodyComposition: c.bcs.score, bcsTrend: c.bcs.trend, bcsHeadline: c.bcs.headline, vitality: c.vitality.score, recovery: c.recovery.score },
    trends: {
      weightRolling7d: c.series.weightRolling.slice(-28).map((x) => [x.date, x.value]),
      waist: c.series.waist.slice(-8).map((x) => [x.date, x.value]),
      strengthIndex: c.series.strength.slice(-8).map((x) => [x.date, x.value]),
      plateau: { kind: c.plateau.kind, recommendation: c.plateau.recommendation },
    },
    plan: {
      nutrition: { kcal: c.nutrition.kcal, proteinG: c.nutrition.proteinG, carbsG: c.nutrition.carbsG, fatG: c.nutrition.fatG, fiberG: c.nutrition.fiberG, waterMl: c.nutrition.waterMl, strategy: c.nutrition.strategy, notes: c.nutrition.notes, simple: c.nutrition.simple },
      meals: c.dayPlan.meals.map((m) => ({ name: m.name, items: m.items.map((i) => `${i.name} ${i.grams} g`), simple: m.simple })),
      fasting: { verdict: c.fasting.verdict, window: c.fasting.suggestedWindow },
      habits: c.habits.map((h) => h.text),
      programSplit: c.program.split,
    },
    review: { headline: c.review.headline, works: c.review.works.map((x) => x.text), blocks: c.review.blocks.map((x) => x.text), change: c.review.change.map((x) => x.text), keep: c.review.keep.map((x) => x.text) },
    decisions: state.decisions.slice(-10).map((d) => ({ date: d.date, summary: d.summary, why: d.why })),
    evidence: [...evidenceIds].map((id) => EVIDENCE[id as keyof typeof EVIDENCE]).filter(Boolean).map((e) => ({ id: e.id, level: e.level, title: e.title, whatWeDo: e.whatWeDo })),
    guardrails: [
      'Ne jamais donner de pourcentage de masse grasse à partir d’une photo.',
      'Ne jamais féliciter une perte de poids sans regarder tour de taille, force et énergie.',
      'Ne jamais proposer de compensation après un repas libre.',
      'Ne pas diagnostiquer ; orienter vers un professionnel en cas de douleur persistante, symptômes inquiétants, trouble alimentaire, grossesse, mineur.',
      'Ton : adulte, direct, chaleureux, sans emoji, sans culpabilisation.',
      'Toute cible chiffrée vient du moteur (plan ci-dessus), jamais inventée.',
    ],
  };
}

export const COACH_SYSTEM_PROMPT = `Tu es le coach RECOMP : un coach de recomposition corporelle, intelligent, chaleureux, direct, pédagogique et adulte.
Tu réponds en français, en 3 à 8 phrases, sans emoji, sans culpabiliser. Tu t'appuies UNIQUEMENT sur le contexte JSON fourni (profil, scores, plan du jour, revue, décisions, niveaux de preuve).
Règles absolues :
- Les chiffres (calories, grammes, charges) viennent du plan fourni. Tu ne les inventes pas. Si une donnée manque, tu le dis.
- Le poids n'est qu'un signal : tu l'interprètes toujours avec le tour de taille, la force et l'énergie.
- Jamais de pourcentage de masse grasse à partir d'une photo. Jamais de « rattrapage » après un repas libre. Jamais de diagnostic médical.
- Quand tu recommandes quelque chose d'important, précise le niveau de preuve (solide / probable / incertain / approche) à partir de la liste fournie.
- Douleur persistante, symptômes inquiétants, grossesse, mineur, trouble alimentaire : tu orientes vers un professionnel avec tact.
- Si les données disent que la stratégie fonctionne, tu dis explicitement de ne rien changer.`;
