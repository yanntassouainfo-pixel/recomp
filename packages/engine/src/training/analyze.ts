import type { EvidenceId, Profile } from '../types';
import { EXERCISE_BY_ID, type Muscle, MUSCLE_LABEL, type MovementPattern } from './exercises';
import type { PlannedExercise, Program, WorkoutDay } from './program';

/** Programme saisi par l'utilisateur (import d'un entraînement existant). */
export interface CustomProgram {
  name: string;
  days: { name: string; weekday: number; exercises: { exerciseId: string; sets: number; repMin: number; repMax: number }[] }[];
}

export interface ProgramIssue {
  level: 'good' | 'warn' | 'bad';
  text: string;
  evidenceId?: EvidenceId;
}

export interface ProgramAnalysis {
  score: number; // 0-100
  verdict: string;
  setsPerMuscle: { muscle: Muscle; label: string; sets: number; frequency: number }[];
  issues: ProgramIssue[];
  estimatedMinutesPerSession: number[];
}

const PUSH: MovementPattern[] = ['horizontal_push', 'vertical_push'];
const PULL: MovementPattern[] = ['horizontal_pull', 'vertical_pull'];

/**
 * Analyse un programme (importé ou généré) : volume par muscle et par semaine, fréquence,
 * équilibre poussée/tirage, bas du corps, fourchettes de répétitions, durée, adéquation au niveau.
 * Les seuils viennent de l'Evidence Layer (volume 10–20 séries/muscle/semaine, fréquence ≥ 2).
 */
export function analyzeProgram(custom: CustomProgram, profile: Profile): ProgramAnalysis {
  const sets: Partial<Record<Muscle, number>> = {};
  const freq: Partial<Record<Muscle, Set<number>>> = {};
  let pushSets = 0, pullSets = 0, lowerSets = 0, upperSets = 0, coreSets = 0, totalSets = 0;
  const issues: ProgramIssue[] = [];
  const minutes: number[] = [];
  const unknown: string[] = [];
  let weirdReps = 0;
  let heavyBarbellBeginner = 0;

  custom.days.forEach((d, di) => {
    let min = 8;
    for (const e of d.exercises) {
      const ex = EXERCISE_BY_ID[e.exerciseId];
      if (!ex) { unknown.push(e.exerciseId); continue; }
      const n = Math.max(0, e.sets);
      totalSets += n;
      min += n * ((ex.compound ? 120 : 60) + 40) / 60;
      const primary = ex.muscles[0];
      ex.muscles.forEach((m, i) => {
        const w = i === 0 ? 1 : 0.5; // muscle secondaire = demi-série
        sets[m] = (sets[m] ?? 0) + n * w;
        (freq[m] ??= new Set()).add(di);
      });
      void primary;
      if (PUSH.includes(ex.pattern)) pushSets += n;
      if (PULL.includes(ex.pattern)) pullSets += n;
      if (ex.lowerBody) lowerSets += n; else if (ex.pattern !== 'core' && ex.pattern !== 'carry') upperSets += n;
      if (ex.pattern === 'core') coreSets += n;
      if (e.repMin < 3 || e.repMax > 30 || e.repMin > e.repMax) weirdReps++;
      if (profile.level === 'beginner' && ['deadlift', 'squat', 'bench_press', 'overhead_press', 'row_barbell'].includes(ex.id) && e.repMax <= 6) heavyBarbellBeginner++;
    }
    minutes.push(Math.round(min));
  });

  const perMuscle = (Object.keys(MUSCLE_LABEL) as Muscle[]).map((m) => ({ muscle: m, label: MUSCLE_LABEL[m], sets: Math.round(sets[m] ?? 0), frequency: freq[m]?.size ?? 0 }));
  const major: Muscle[] = ['quads', 'hamstrings', 'glutes', 'chest', 'back', 'lats', 'side_delts'];
  let score = 70;

  if (unknown.length) { issues.push({ level: 'warn', text: `${unknown.length} exercice(s) non reconnu(s) : ${unknown.join(', ')}. Ils ne sont pas comptés.` }); score -= 5; }
  if (custom.days.length === 0 || totalSets === 0) return { score: 0, verdict: 'Aucun exercice saisi.', setsPerMuscle: perMuscle, issues: [{ level: 'bad', text: 'Ajoute au moins une séance avec des exercices.' }], estimatedMinutesPerSession: minutes };

  // Volume par muscle majeur
  const low = major.filter((m) => (sets[m] ?? 0) < 6);
  const high = major.filter((m) => (sets[m] ?? 0) > 25);
  const ok = major.filter((m) => (sets[m] ?? 0) >= 10 && (sets[m] ?? 0) <= 20);
  if (ok.length >= 5) { issues.push({ level: 'good', text: `Volume dans la zone 10–20 séries/semaine pour ${ok.length} groupes majeurs sur ${major.length}.`, evidenceId: 'volume_hypertrophy' }); score += 10; }
  if (low.length) { issues.push({ level: low.length >= 3 ? 'bad' : 'warn', text: `Volume faible (< 6 séries/semaine) : ${low.map((m) => MUSCLE_LABEL[m]).join(', ')}. Sous ce seuil, la progression de ces muscles sera lente.`, evidenceId: 'volume_hypertrophy' }); score -= 5 * low.length; }
  if (high.length) { issues.push({ level: 'warn', text: `Volume très élevé (> 25 séries/semaine) : ${high.map((m) => MUSCLE_LABEL[m]).join(', ')}. Rendements décroissants et récupération à surveiller.`, evidenceId: 'volume_hypertrophy' }); score -= 4 * high.length; }

  // Fréquence
  const once = major.filter((m) => (sets[m] ?? 0) >= 6 && (freq[m]?.size ?? 0) < 2);
  if (once.length >= 3 && custom.days.length >= 3) { issues.push({ level: 'warn', text: `Chaque muscle n’est travaillé qu’une fois par semaine (${once.map((m) => MUSCLE_LABEL[m]).join(', ')}). Deux passages par semaine donnent un peu plus de résultats à volume égal.`, evidenceId: 'training_frequency' }); score -= 6; }
  else if (custom.days.length >= 2 && once.length === 0) { issues.push({ level: 'good', text: 'Chaque groupe majeur est sollicité au moins deux fois par semaine.', evidenceId: 'training_frequency' }); score += 6; }

  // Équilibre poussée / tirage
  if (pushSets > 0 || pullSets > 0) {
    const ratio = pullSets === 0 ? Infinity : pushSets / pullSets;
    if (ratio > 1.5 || pullSets === 0) { issues.push({ level: 'warn', text: `Beaucoup de poussée (${pushSets} séries) pour peu de tirage (${pullSets}). À terme : épaules en avant, dos sous-développé. Vise au moins autant de tirage que de poussée.` }); score -= 8; }
    else if (ratio < 0.6) { issues.push({ level: 'warn', text: `Beaucoup de tirage (${pullSets}) pour peu de poussée (${pushSets}). Ajoute une poussée horizontale et une verticale.` }); score -= 4; }
    else { issues.push({ level: 'good', text: `Poussée / tirage équilibrés (${pushSets} / ${pullSets} séries).` }); score += 4; }
  }
  // Bas du corps
  const lowerShare = totalSets ? lowerSets / totalSets : 0;
  if (lowerShare < 0.25) { issues.push({ level: lowerShare < 0.12 ? 'bad' : 'warn', text: `Bas du corps : ${Math.round(lowerShare * 100)} % des séries. Les jambes et les fessiers sont la moitié de ta masse musculaire ; vise 30–45 %.` }); score -= 10; }
  else if (lowerShare > 0.6) { issues.push({ level: 'warn', text: `Bas du corps : ${Math.round(lowerShare * 100)} % des séries, le haut du corps manque de volume.` }); score -= 4; }
  else { issues.push({ level: 'good', text: `Répartition haut / bas équilibrée (${Math.round(lowerShare * 100)} % bas du corps).` }); score += 4; }
  void upperSets;
  if (coreSets === 0) issues.push({ level: 'warn', text: 'Pas de gainage. Un ou deux exercices par semaine suffisent pour la posture et la stabilité.' });

  // Répétitions
  if (weirdReps) { issues.push({ level: 'warn', text: `${weirdReps} exercice(s) avec une fourchette de répétitions inhabituelle (< 3, > 30 ou inversée).` }); score -= 3 * weirdReps; }
  if (heavyBarbellBeginner) { issues.push({ level: 'warn', text: 'Débutant avec des mouvements barre lourds à ≤ 6 reps : commence par des fourchettes 8–12 pour apprendre la technique, puis descends.', evidenceId: 'progressive_overload' }); score -= 5; }

  // Durée
  const tooLong = minutes.filter((m) => m > profile.sessionMinutes * 1.3);
  if (tooLong.length) { issues.push({ level: 'warn', text: `${tooLong.length} séance(s) estimée(s) au-delà de ${profile.sessionMinutes} min (${tooLong.join(', ')} min). Un programme trop long est un programme abandonné.`, evidenceId: 'flex_meal_adherence' }); score -= 5 * tooLong.length; }
  if (custom.days.length > profile.sessionsPerWeek) { issues.push({ level: 'warn', text: `${custom.days.length} séances alors que tu en as déclaré ${profile.sessionsPerWeek} de disponibles. Le meilleur programme est celui que tu tiens.` }); score -= 6; }

  // Limitations
  const excluded = profile.limitations.map((l) => l.region);
  const risky = custom.days.flatMap((d) => d.exercises.map((e) => EXERCISE_BY_ID[e.exerciseId])).filter((ex) => ex && ex.stress.some((r) => excluded.includes(r)));
  if (risky.length) { issues.push({ level: 'bad', text: `Exercices qui sollicitent une zone sensible déclarée : ${[...new Set(risky.map((ex) => ex!.name))].join(', ')}. Substituts proposés dans la bibliothèque.`, evidenceId: 'readiness_autoregulation' }); score -= 10; }

  score = Math.max(0, Math.min(100, Math.round(score)));
  const verdict = score >= 80 ? 'Bon programme : structure cohérente, volume dans la zone utile. On peut le suivre tel quel en appliquant la double progression.' : score >= 60 ? 'Programme correct avec quelques points à corriger (voir ci-dessous). Utilisable après ajustements.' : score >= 40 ? 'Programme déséquilibré : il fera progresser certaines zones et négligera d’autres. Je recommande le programme généré, ou de corriger les points ci-dessous.' : 'Programme à revoir en profondeur. Le programme généré à partir de ton profil sera plus efficace et plus sûr.';
  return { score, verdict, setsPerMuscle: perMuscle, issues, estimatedMinutesPerSession: minutes };
}

/** Convertit un programme personnalisé au format du moteur (jours, cibles, progression). */
export function customToProgram(custom: CustomProgram, profile: Profile): Program {
  const days: WorkoutDay[] = custom.days.map((d, i) => {
    const exercises: PlannedExercise[] = d.exercises.filter((e) => EXERCISE_BY_ID[e.exerciseId]).map((e) => {
      const ex = EXERCISE_BY_ID[e.exerciseId]!;
      return { exerciseId: ex.id, name: ex.name, sets: Math.max(1, e.sets), repMin: e.repMin, repMax: e.repMax, restSec: ex.compound ? 120 : 60, rirTarget: profile.level === 'beginner' ? 3 : 2, note: ex.pattern === 'core' && (ex.id === 'plank' || ex.id === 'farmer_carry') ? 'En secondes' : undefined };
    });
    const minutes = 8 + exercises.reduce((a, e) => a + e.sets * ((e.restSec + 40) / 60), 0);
    return { id: `custom_${i + 1}`, name: d.name || `Séance ${i + 1}`, focus: 'Programme importé', estimatedMinutes: Math.round(minutes), exercises, weekday: d.weekday };
  });
  const totalSets = days.reduce((a, d) => a + d.exercises.reduce((b, e) => b + e.sets, 0), 0);
  return { split: custom.name || 'Programme importé', splitStyle: 'full_body', availableStyles: ['full_body', 'upper_lower', 'ppl'], rationale: 'Programme importé par toi. Le moteur applique la double progression, l’autorégulation selon ta forme du jour et les phases du plan. Tu peux revenir au programme généré dans ton profil.', weeklySetsPerMuscleApprox: Math.round((totalSets * 1.6) / 8), days, honestNotes: ['Programme importé : son analyse est dans « Analyser un programme ».'] };
}
