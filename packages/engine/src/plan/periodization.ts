import type { EvidenceId, Goal, ISODate, Profile } from '../types';
import { addDays, dayOfWeek } from '../stats';
import type { Program } from '../training/program';

export type PhaseIntent = 'foundation' | 'build' | 'intensify' | 'deload' | 'diet_break' | 'consolidate' | 'routine';
export type NutritionMode = 'plan' | 'maintenance';

export interface PlanPhase {
  id: string;
  name: string;
  intent: PhaseIntent;
  weeks: number;
  focus: string;
  description: string;
  why: string;
  evidenceId: EvidenceId;
  /** multiplicateur de séries appliqué aux séances */
  volumeMultiplier: number;
  /** réserve cible (RIR) en fin de série */
  rirTarget: number;
  nutritionMode: NutritionMode;
}

export interface PlannedSession {
  date: ISODate;
  workoutDayId: string;
  name: string;
}

export interface WeekPlan {
  weekNumber: number;
  startDate: ISODate;
  endDate: ISODate;
  phaseId: string;
  sessions: PlannedSession[];
  measurementDate: ISODate;
  reviewDate: ISODate;
  photoDate: ISODate | null;
  isDeload: boolean;
  notes: string[];
}

export interface Milestone {
  date: ISODate;
  kind: 'phase' | 'photos' | 'deload' | 'diet_break' | 'end';
  label: string;
}

export interface ProgramPlan {
  startDate: ISODate;
  endDate: ISODate;
  weeksTotal: number;
  goalStatement: string;
  phases: PlanPhase[];
  weeks: WeekPlan[];
  milestones: Milestone[];
}

const ph = (id: string, name: string, intent: PhaseIntent, weeks: number, focus: string, description: string, why: string, evidenceId: EvidenceId, volumeMultiplier: number, rirTarget: number, nutritionMode: NutritionMode = 'plan'): PlanPhase => ({ id, name, intent, weeks, focus, description, why, evidenceId, volumeMultiplier, rirTarget, nutritionMode });

/** Phases selon l'objectif principal, le niveau et le mode. 12 semaines par défaut. */
export function phasesFor(profile: Profile): PlanPhase[] {
  const g: Goal = profile.primaryGoal;
  const beginner = profile.level === 'beginner';
  const busy = profile.mode === 'busy';
  const vol = busy ? 0.85 : 1;
  const foundationWeeks = beginner ? 3 : 2;

  const foundation = ph('foundation', 'Fondation', 'foundation', foundationWeeks, 'Technique, régularité, repères', 'On apprend les mouvements, on trouve les charges de départ, on installe la routine des check-ins et du tour de taille. Aucune recherche de record.', 'Les deux premières semaines servent à calibrer : charges, dépense réelle, sommeil. Décider avant serait décider sur du bruit.', 'weight_noise', 0.8 * vol, 3);
  const deload = ph('deload', 'Semaine allégée', 'deload', 1, 'Dissiper la fatigue', 'Volume réduit de 40 %, charges à −10 %. Les séances restent courtes et faciles ; le sommeil et la marche prennent la place.', 'La fatigue s’accumule plus vite que la forme ; une semaine légère planifiée évite la semaine subie.', 'deload', 0.6 * vol, 3, 'maintenance');
  const consolidate = ph('consolidate', 'Consolidation', 'consolidate', 1, 'Photos, mesures, bilan', 'Semaine à maintenance pour refaire les photos dans de bonnes conditions, mesurer, et décider du bloc suivant avec le rapport mensuel.', 'Mesurer à maintenance donne une image fidèle : moins d’eau en moins, glycogène rechargé.', 'recomposition_feasibility', 0.9 * vol, 2, 'maintenance');

  if (g === 'fat_loss') {
    return [
      foundation,
      ph('deficit1', 'Déficit modéré I', 'build', 5, 'Perdre du gras, garder la force', 'Déficit modéré, protéines hautes, séances complètes : on vise un tour de taille qui descend sans que la force recule.', 'Un rythme ≤ 0,7 %/semaine préserve la masse maigre.', 'deficit_rate', 1.0 * vol, 2),
      ph('break', 'Pause diète', 'diet_break', 1, 'Maintenance planifiée', 'Une semaine à maintenance : faim en baisse, entraînement de qualité, moral. Ce n’est pas une récompense, c’est une stratégie.', 'Alterner déficit et maintenance aide l’adhérence et la conservation de la dépense énergétique.', 'diet_break', 1.0 * vol, 2, 'maintenance'),
      ph('deficit2', 'Déficit modéré II', 'build', 12 - foundationWeeks - 5 - 1 - 1, 'Reprendre le déficit', 'Retour au déficit avec les cibles recalculées sur ton nouveau poids et tes tendances réelles.', 'Les cibles recalculées évitent le déficit « fantôme » qui diminue avec le poids.', 'deficit_rate', 1.0 * vol, 2),
      consolidate,
    ];
  }
  if (g === 'muscle_gain') {
    return [
      foundation,
      ph('volume', 'Volume', 'build', 5, 'Accumuler du travail', 'Léger surplus, séries qui montent progressivement, double progression sur tous les mouvements.', 'L’hypertrophie suit le volume hebdomadaire jusqu’à un plateau individuel.', 'volume_hypertrophy', 1.1 * vol, 2),
      deload,
      ph('intensity', 'Intensité', 'intensify', 12 - foundationWeeks - 5 - 1 - 1, 'Charges plus lourdes', 'Moins de séries, plus lourd, 1–2 reps en réserve : on convertit le volume accumulé en force visible.', 'Alterner volume et intensité est le cœur d’une périodisation simple.', 'periodization', 0.9 * vol, 1),
      consolidate,
    ];
  }
  if (g === 'strength') {
    return [
      foundation,
      ph('accumulation', 'Accumulation', 'build', 4, 'Volume sur les mouvements clés', 'Fourchettes 6–10, double progression, technique irréprochable.', 'Le volume prépare l’intensification.', 'periodization', 1.0 * vol, 2),
      deload,
      ph('intensification', 'Intensification', 'intensify', 12 - foundationWeeks - 4 - 1 - 1, 'Charges lourdes', 'Fourchettes 3–6 sur les mouvements clés, accessoires maintenus.', 'La force se construit en bas des fourchettes, après avoir accumulé.', 'progressive_overload', 0.85 * vol, 1),
      ph('test', 'Semaine test', 'consolidate', 1, 'Mesurer la force', 'Charges maximales estimées à 2–3 reps, pas de 1RM réel : on mesure sans se blesser.', 'Un test à 2–3 reps est aussi informatif qu’un 1RM et bien moins risqué.', 'readiness_autoregulation', 0.6 * vol, 2, 'maintenance'),
    ];
  }
  if (g === 'recomposition' || g === 'definition' || g === 'athletic') {
    return [
      foundation,
      ph('build', 'Construction', 'build', 4, 'Muscle en priorité, déficit léger', 'Maintenance les jours d’entraînement, déficit léger au repos, protéines à 2 g/kg. On cherche un tour de taille qui descend et une force qui monte.', 'C’est la combinaison documentée de la recomposition chez des personnes entraînées.', 'recomposition_feasibility', 1.0 * vol, 2),
      deload,
      ph('intensify', 'Intensification', 'intensify', 12 - foundationWeeks - 4 - 1 - 1, 'Convertir en force visible', 'Mêmes cibles nutritionnelles, charges plus lourdes, 1–2 reps en réserve, volume légèrement réduit.', 'Alterner volume et intensité évite la stagnation et limite la fatigue.', 'periodization', 0.9 * vol, 1),
      consolidate,
    ];
  }
  // énergie, sommeil, santé, condition : routine avant tout
  return [
    ph('routine', 'Routine', 'routine', 4, 'Installer les habitudes', 'Séances courtes, marche quotidienne, sommeil régulier, protéines à chaque repas. Le but est de tenir, pas de forcer.', 'Pour ces objectifs, la régularité pèse plus que l’intensité.', 'steps_neat', 0.8 * vol, 3, 'maintenance'),
    ph('progress', 'Progression douce', 'build', 4, 'Un cran de plus', 'Une série de plus par exercice, 1 000 pas de plus, horaire de coucher tenu 6 soirs sur 7.', 'La progression visible entretient la motivation.', 'progressive_overload', 1.0 * vol, 2, 'maintenance'),
    deload,
    ph('consolidate2', 'Consolidation', 'consolidate', 3, 'Faire le point', 'Photos, mesures, rapport, puis décision : continuer, ou passer en recomposition.', 'Après 12 semaines de routine, on sait ce qui est tenable.', 'flex_meal_adherence', 1.0 * vol, 2, 'maintenance'),
  ];
}

function goalStatementFor(profile: Profile): string {
  const w = profile.startWeightKg;
  switch (profile.primaryGoal) {
    case 'recomposition':
    case 'definition':
    case 'athletic':
      return `12 semaines pour transformer la composition de tes ${w} kg : tour de taille en baisse, force en hausse, poids à peu près stable.`;
    case 'fat_loss':
      return profile.targetWeightKg
        ? `Bloc de 12 semaines vers ${profile.targetWeightKg} kg : ≤ 0,7 % du poids par semaine, force maintenue. Les blocs s’enchaînent jusqu’à l’objectif, avec une pause diète à chaque bloc.`
        : `12 semaines pour perdre du gras sans perdre de muscle : ≤ 0,7 % du poids par semaine, force maintenue.`;
    case 'muscle_gain':
      return `12 semaines pour construire du muscle : surplus léger, volume progressif, tour de taille sous surveillance.`;
    case 'strength':
      return `12 semaines pour devenir plus fort sur tes mouvements clés, avec une semaine test à la fin.`;
    default:
      return `12 semaines pour installer une routine tenable : énergie, sommeil, mouvement.`;
  }
}

/**
 * Construit le plan semaine par semaine à partir du profil et du programme :
 * séances posées sur les jours d'entraînement, mesures le dimanche (ou dernier jour de la semaine),
 * revue hebdomadaire, photos toutes les 4 semaines et en consolidation.
 */
export function buildProgramPlan(profile: Profile, program: Program, startDate: ISODate = profile.createdAt): ProgramPlan {
  const phases = phasesFor(profile);
  const weeksTotal = phases.reduce((a, p) => a + p.weeks, 0);
  // Début de semaine = lundi de la semaine du startDate
  const dow = dayOfWeek(startDate);
  const monday = addDays(startDate, dow === 0 ? -6 : 1 - dow);
  const weeks: WeekPlan[] = [];
  const milestones: Milestone[] = [];
  let weekIdx = 0;
  for (const phase of phases) {
    milestones.push({ date: addDays(monday, weekIdx * 7), kind: phase.intent === 'deload' ? 'deload' : phase.intent === 'diet_break' ? 'diet_break' : 'phase', label: phase.name });
    for (let i = 0; i < phase.weeks; i++) {
      const start = addDays(monday, weekIdx * 7);
      const end = addDays(start, 6);
      const sessions: PlannedSession[] = program.days
        .map((d) => ({ date: addDays(start, (d.weekday + 6) % 7), workoutDayId: d.id, name: d.name }))
        .sort((a, b) => (a.date < b.date ? -1 : 1));
      const n = weekIdx + 1;
      const photoDate = n === 1 || n % 4 === 0 || phase.intent === 'consolidate' ? end : null;
      if (photoDate && n > 1) milestones.push({ date: photoDate, kind: 'photos', label: 'Photos de suivi' });
      const notes: string[] = [];
      if (phase.intent === 'deload') notes.push('Séries −40 %, charges −10 %. Sommeil et marche prioritaires.');
      if (phase.intent === 'diet_break') notes.push('Apports à maintenance toute la semaine. Pas de pesée quotidienne : le poids remonte un peu (glycogène, eau), c’est attendu.');
      if (phase.intent === 'consolidate') notes.push('Photos dans les mêmes conditions qu’au départ, mesures complètes, rapport mensuel.');
      if (n === 1) notes.push('Trouver les charges de départ : 2–3 reps en réserve, noter tout.');
      weeks.push({ weekNumber: n, startDate: start, endDate: end, phaseId: phase.id, sessions, measurementDate: end, reviewDate: end, photoDate, isDeload: phase.intent === 'deload', notes });
      weekIdx++;
    }
  }
  const endDate = addDays(monday, weeksTotal * 7 - 1);
  milestones.push({ date: endDate, kind: 'end', label: 'Fin du bloc : rapport et décision' });
  return { startDate: monday, endDate, weeksTotal, goalStatement: goalStatementFor(profile), phases, weeks, milestones };
}

export function weekFor(plan: ProgramPlan, date: ISODate): WeekPlan | null {
  return plan.weeks.find((w) => w.startDate <= date && w.endDate >= date) ?? null;
}

export function phaseFor(plan: ProgramPlan, date: ISODate): PlanPhase | null {
  const w = weekFor(plan, date);
  return w ? plan.phases.find((p) => p.id === w.phaseId) ?? null : null;
}
