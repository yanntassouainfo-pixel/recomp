import type { DailyCheckin, ReadinessLevel } from '../types';
import type { PlannedExercise, WorkoutDay } from './program';

export interface AdjustedSession {
  readiness: ReadinessLevel;
  title: string;
  message: string;
  exercises: PlannedExercise[];
  estimatedMinutes: number;
  replacedByRecovery: boolean;
  stopAdvice?: string;
}

/**
 * Autorégulation : la séance s'adapte à l'état du jour.
 * push → prévue (+ permission de viser le haut) ; normal → prévue ; light → −1 série/exercice, RIR +1 ; rest → récupération active.
 */
export function adjustSession(day: WorkoutDay, readiness: ReadinessLevel, checkin?: DailyCheckin | null): AdjustedSession {
  const pain = checkin?.pain;
  if (pain?.unusual && pain.severity >= 3) {
    return {
      readiness: 'rest',
      title: 'Pas de séance sur cette zone aujourd’hui',
      message: `Douleur inhabituelle (${pain.region}) : on ne pousse pas. Mobilité douce et marche si c’est confortable. Si la douleur persiste au-delà de quelques jours, s’intensifie ou s’accompagne d’un gonflement, consulte un professionnel de santé.`,
      exercises: [],
      estimatedMinutes: 20,
      replacedByRecovery: true,
      stopAdvice: 'Ce n’est pas un échec : c’est la décision qui protège les 6 prochains mois.',
    };
  }
  if (readiness === 'rest') {
    return {
      readiness,
      title: 'Récupération active',
      message: 'Marche 20–30 min, 10 min de mobilité, respiration lente 5 min, coucher plus tôt. La séance est décalée au prochain créneau.',
      exercises: [],
      estimatedMinutes: 30,
      replacedByRecovery: true,
    };
  }
  if (readiness === 'light') {
    const exercises = day.exercises.map((e) => ({ ...e, sets: Math.max(2, e.sets - 1), rirTarget: e.rirTarget + 1, note: 'Allégé' }));
    return {
      readiness,
      title: `${day.name} — version allégée`,
      message: 'Fatigue notable : une série de moins par exercice et 1 rep de réserve supplémentaire. Tu gardes le stimulus, tu évites la dette.',
      exercises,
      estimatedMinutes: Math.round(day.estimatedMinutes * 0.75),
      replacedByRecovery: false,
    };
  }
  if (readiness === 'push') {
    return {
      readiness,
      title: `${day.name}`,
      message: 'Forme excellente : séance prévue. Si une série est facile, vise le haut de la fourchette — c’est le jour pour progresser.',
      exercises: day.exercises,
      estimatedMinutes: day.estimatedMinutes,
      replacedByRecovery: false,
    };
  }
  return {
    readiness,
    title: day.name,
    message: 'Forme correcte : séance prévue telle quelle.',
    exercises: day.exercises,
    estimatedMinutes: day.estimatedMinutes,
    replacedByRecovery: false,
  };
}
