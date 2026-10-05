import type { Profile, VisualGoal } from '../types';
import { candidates, EXERCISE_BY_ID, type Exercise, type MovementPattern } from './exercises';

export interface PlannedExercise {
  exerciseId: string;
  name: string;
  sets: number;
  repMin: number;
  repMax: number;
  restSec: number;
  rirTarget: number;
  note?: string;
}

export interface WorkoutDay {
  id: string;
  name: string;
  focus: string;
  estimatedMinutes: number;
  exercises: PlannedExercise[];
  /** jour de la semaine 0=dim … 6=sam */
  weekday: number;
}

export interface Program {
  split: string;
  rationale: string;
  weeklySetsPerMuscleApprox: number;
  days: WorkoutDay[];
  honestNotes: string[];
}

interface Slot { pattern: MovementPattern; priority: number; label: string }

const SPLITS: Record<number, { name: string; days: { name: string; focus: string; slots: Slot[] }[] }> = {
  2: {
    name: 'Full body ×2',
    days: [
      { name: 'Full Body A', focus: 'Corps entier — accent bas du corps', slots: fb(['squat', 'horizontal_push', 'horizontal_pull', 'hinge', 'vertical_push', 'core', 'iso_shoulders']) },
      { name: 'Full Body B', focus: 'Corps entier — accent haut du corps', slots: fb(['hinge', 'vertical_pull', 'horizontal_push', 'lunge', 'horizontal_pull', 'iso_arms_biceps', 'iso_arms_triceps']) },
    ],
  },
  3: {
    name: 'Full body A/B/C',
    days: [
      { name: 'Full Body A', focus: 'Squat + poussée horizontale + tirage', slots: fb(['squat', 'horizontal_push', 'horizontal_pull', 'iso_shoulders', 'core', 'iso_arms_triceps', 'iso_calves']) },
      { name: 'Full Body B', focus: 'Charnière + poussée verticale + tirage vertical', slots: fb(['hinge', 'vertical_push', 'vertical_pull', 'lunge', 'iso_arms_biceps', 'core', 'iso_shoulders']) },
      { name: 'Full Body C', focus: 'Volume & isolation', slots: fb(['lunge', 'horizontal_push', 'horizontal_pull', 'hinge', 'iso_shoulders', 'iso_legs', 'core']) },
    ],
  },
  4: {
    name: 'Haut / Bas ×2',
    days: [
      { name: 'Haut A', focus: 'Poussée & tirage — force', slots: fb(['horizontal_push', 'horizontal_pull', 'vertical_push', 'vertical_pull', 'iso_shoulders', 'iso_arms_triceps', 'iso_arms_biceps']) },
      { name: 'Bas A', focus: 'Squat dominant', slots: fb(['squat', 'hinge', 'lunge', 'iso_legs', 'iso_calves', 'core', 'carry']) },
      { name: 'Haut B', focus: 'Poussée & tirage — volume', slots: fb(['vertical_pull', 'horizontal_push', 'horizontal_pull', 'vertical_push', 'iso_shoulders', 'iso_arms_biceps', 'iso_arms_triceps']) },
      { name: 'Bas B', focus: 'Charnière dominante', slots: fb(['hinge', 'squat', 'lunge', 'iso_legs', 'iso_calves', 'core', 'carry']) },
    ],
  },
  5: {
    name: 'Haut / Bas / Push / Pull / Legs',
    days: [
      { name: 'Haut', focus: 'Haut du corps complet', slots: fb(['horizontal_push', 'horizontal_pull', 'vertical_push', 'vertical_pull', 'iso_shoulders', 'iso_arms_biceps', 'iso_arms_triceps']) },
      { name: 'Bas', focus: 'Bas du corps complet', slots: fb(['squat', 'hinge', 'lunge', 'iso_legs', 'iso_calves', 'core', 'carry']) },
      { name: 'Push', focus: 'Pectoraux, épaules, triceps', slots: fb(['horizontal_push', 'vertical_push', 'horizontal_push', 'iso_shoulders', 'iso_arms_triceps', 'core', 'iso_shoulders']) },
      { name: 'Pull', focus: 'Dos, biceps, arrière d’épaules', slots: fb(['vertical_pull', 'horizontal_pull', 'horizontal_pull', 'iso_shoulders', 'iso_arms_biceps', 'carry', 'core']) },
      { name: 'Legs', focus: 'Jambes & fessiers', slots: fb(['hinge', 'squat', 'lunge', 'iso_legs', 'iso_calves', 'core', 'carry']) },
    ],
  },
  6: {
    name: 'Push / Pull / Legs ×2',
    days: [
      { name: 'Push A', focus: 'Force', slots: fb(['horizontal_push', 'vertical_push', 'iso_shoulders', 'iso_arms_triceps', 'core', 'horizontal_push', 'iso_shoulders']) },
      { name: 'Pull A', focus: 'Force', slots: fb(['vertical_pull', 'horizontal_pull', 'iso_shoulders', 'iso_arms_biceps', 'carry', 'horizontal_pull', 'core']) },
      { name: 'Legs A', focus: 'Squat dominant', slots: fb(['squat', 'hinge', 'lunge', 'iso_legs', 'iso_calves', 'core', 'carry']) },
      { name: 'Push B', focus: 'Volume', slots: fb(['vertical_push', 'horizontal_push', 'iso_shoulders', 'iso_arms_triceps', 'horizontal_push', 'core', 'iso_shoulders']) },
      { name: 'Pull B', focus: 'Volume', slots: fb(['horizontal_pull', 'vertical_pull', 'iso_shoulders', 'iso_arms_biceps', 'horizontal_pull', 'carry', 'core']) },
      { name: 'Legs B', focus: 'Charnière dominante', slots: fb(['hinge', 'lunge', 'squat', 'iso_legs', 'iso_calves', 'core', 'carry']) },
    ],
  },
};

function fb(patterns: MovementPattern[]): Slot[] {
  return patterns.map((p, i) => ({ pattern: p, priority: i, label: p }));
}

const VISUAL_BIAS: Partial<Record<VisualGoal, MovementPattern>> = {
  wider_shoulders: 'iso_shoulders',
  bigger_arms: 'iso_arms_biceps',
  wider_back: 'vertical_pull',
  stronger_legs: 'lunge',
  flat_stomach: 'core',
};

export function exerciseCount(sessionMinutes: number, mode: Profile['mode']): number {
  const base = sessionMinutes <= 35 ? 4 : sessionMinutes <= 50 ? 5 : sessionMinutes <= 65 ? 6 : 7;
  return mode === 'busy' ? Math.min(base, 5) : base;
}

export function generateProgram(profile: Profile): Program {
  const n = Math.min(6, Math.max(2, profile.sessionsPerWeek));
  const split = SPLITS[n]!;
  const excluded = profile.limitations.map((l) => l.region);
  const count = exerciseCount(profile.sessionMinutes, profile.mode);
  const honestNotes: string[] = [];

  // Biais visuels : on remonte la priorité d'un pattern lié à l'objectif visuel.
  const boosted = new Set<MovementPattern>();
  for (const vg of profile.visualGoals) {
    const p = VISUAL_BIAS[vg];
    if (p) boosted.add(p);
  }
  if (profile.visualGoals.includes('flat_stomach')) {
    honestNotes.push('« Ventre plus plat » : aucun exercice ne cible la graisse abdominale. Le gainage améliore la posture ; la graisse abdominale recule avec la recomposition globale, mesurée par ton tour de taille.');
  }
  if (profile.visualGoals.includes('defined') || profile.visualGoals.includes('leaner')) {
    honestNotes.push('« Plus dessiné » : la définition vient de la combinaison muscle conservé + graisse réduite. Le programme construit le muscle ; la nutrition et le sommeil révèlent le dessin.');
  }
  if (profile.mode === 'busy') honestNotes.push('Mode Busy : séances courtes, exercices composés, supersets possibles. C’est le minimum efficace, pas une version dégradée.');

  const baseSets = profile.level === 'beginner' ? 3 : profile.level === 'advanced' ? 4 : 3;
  const setsFor = (ex: Exercise) => (profile.mode === 'busy' ? Math.max(2, baseSets - 1) : ex.compound ? baseSets : Math.max(2, baseSets - 1));

  const trainingDays = profile.trainingDays.length >= n ? profile.trainingDays.slice(0, n) : spreadDays(n);

  const used = new Set<string>();
  const days: WorkoutDay[] = split.days.map((d, di) => {
    // Ordonner les slots : composés d'abord, puis biais visuel remonté dans les isolations
    const slots = [...d.slots].sort((a, b) => {
      const ab = boosted.has(a.pattern) && !isCompoundPattern(a.pattern) ? -0.5 : 0;
      const bb = boosted.has(b.pattern) && !isCompoundPattern(b.pattern) ? -0.5 : 0;
      return a.priority + ab - (b.priority + bb);
    });
    const chosen: PlannedExercise[] = [];
    for (const slot of slots) {
      if (chosen.length >= count) break;
      const cands = candidates(slot.pattern, profile.equipment, profile.level, excluded);
      if (cands.length === 0) continue;
      // varier entre jours : préférer un exercice non encore utilisé cette semaine, sinon le premier
      const ex = cands.find((c) => !used.has(c.id)) ?? cands[0]!;
      used.add(ex.id);
      const [rmin, rmax] = ex.repRange;
      const isTime = ex.pattern === 'core' && (ex.id === 'plank' || ex.id === 'farmer_carry');
      chosen.push({
        exerciseId: ex.id,
        name: ex.name,
        sets: setsFor(ex),
        repMin: rmin,
        repMax: rmax,
        restSec: ex.compound ? (profile.mode === 'busy' ? 90 : 120) : 60,
        rirTarget: profile.level === 'beginner' ? 3 : 2,
        note: isTime ? 'En secondes' : boosted.has(ex.pattern) ? 'Priorité liée à ton objectif visuel' : undefined,
      });
    }
    const minutes = 8 + chosen.reduce((a, e) => a + e.sets * ((e.restSec + 40) / 60), 0);
    return { id: `day_${di + 1}`, name: d.name, focus: d.focus, estimatedMinutes: Math.round(minutes), exercises: chosen, weekday: trainingDays[di] ?? di };
  });

  const totalSets = days.reduce((a, d) => a + d.exercises.reduce((b, e) => b + e.sets, 0), 0);
  const weeklySetsPerMuscleApprox = Math.round((totalSets * 1.6) / 8); // approximation grossière : 8 groupes, composés comptent ~1,6

  const rationale = `${n} séances/semaine → ${split.name}. Chaque muscle est travaillé au moins 2×/semaine, ce que les données associent à une meilleure hypertrophie à volume égal. ${count} exercices par séance pour tenir en ~${profile.sessionMinutes} min.`;

  if (profile.limitations.length) honestNotes.push(`Limitations prises en compte (${profile.limitations.map((l) => l.region).join(', ')}) : exercices qui sollicitent ces zones exclus, substitutions proposées. En cas de douleur persistante, consulte un professionnel.`);

  return { split: split.name, rationale, weeklySetsPerMuscleApprox, days, honestNotes };
}

function isCompoundPattern(p: MovementPattern): boolean {
  return ['squat', 'hinge', 'lunge', 'horizontal_push', 'vertical_push', 'horizontal_pull', 'vertical_pull'].includes(p);
}

function spreadDays(n: number): number[] {
  const presets: Record<number, number[]> = { 2: [1, 4], 3: [1, 3, 5], 4: [1, 2, 4, 5], 5: [1, 2, 3, 5, 6], 6: [1, 2, 3, 4, 5, 6] };
  return presets[n] ?? [1, 3, 5];
}

export function exerciseName(id: string): string {
  return EXERCISE_BY_ID[id]?.name ?? id;
}
