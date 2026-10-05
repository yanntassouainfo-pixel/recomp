import type { BodyRegion, Equipment, TrainingLevel } from '../types';

export type MovementPattern =
  | 'squat'
  | 'hinge'
  | 'lunge'
  | 'horizontal_push'
  | 'vertical_push'
  | 'horizontal_pull'
  | 'vertical_pull'
  | 'core'
  | 'iso_shoulders'
  | 'iso_arms_biceps'
  | 'iso_arms_triceps'
  | 'iso_legs'
  | 'iso_calves'
  | 'carry';

export type Muscle = 'quads' | 'glutes' | 'hamstrings' | 'calves' | 'chest' | 'back' | 'lats' | 'traps' | 'front_delts' | 'side_delts' | 'rear_delts' | 'biceps' | 'triceps' | 'core' | 'forearms';

export interface Exercise {
  id: string;
  name: string;
  pattern: MovementPattern;
  muscles: Muscle[];
  equipment: Equipment[]; // dans quels contextes il est faisable
  minLevel: TrainingLevel;
  stress: BodyRegion[]; // zones sollicitées (exclusion en cas de limitation)
  repRange: [number, number];
  compound: boolean;
  lowerBody: boolean;
  cues: string;
}

const L = (lvl: TrainingLevel) => lvl;

export const EXERCISES: Exercise[] = [
  // Squat
  { id: 'squat', name: 'Squat barre', pattern: 'squat', muscles: ['quads', 'glutes', 'core'], equipment: ['gym'], minLevel: L('intermediate'), stress: ['knee', 'lower_back', 'hip'], repRange: [5, 8], compound: true, lowerBody: true, cues: 'Pieds largeur d’épaules, descends contrôlé, pousse le sol.' },
  { id: 'goblet_squat', name: 'Goblet squat (haltère/kettlebell)', pattern: 'squat', muscles: ['quads', 'glutes', 'core'], equipment: ['gym', 'home_basic'], minLevel: L('beginner'), stress: ['knee', 'hip'], repRange: [8, 12], compound: true, lowerBody: true, cues: 'Haltère contre la poitrine, coudes vers l’intérieur des genoux.' },
  { id: 'leg_press', name: 'Presse à cuisses', pattern: 'squat', muscles: ['quads', 'glutes'], equipment: ['gym'], minLevel: L('beginner'), stress: ['knee'], repRange: [8, 12], compound: true, lowerBody: true, cues: 'Amplitude complète sans décoller le bassin.' },
  { id: 'bodyweight_squat', name: 'Squat au poids du corps / pistol assisté', pattern: 'squat', muscles: ['quads', 'glutes'], equipment: ['home_none', 'home_basic'], minLevel: L('beginner'), stress: ['knee'], repRange: [12, 20], compound: true, lowerBody: true, cues: 'Tempo lent, pause en bas pour augmenter la difficulté.' },
  // Hinge
  { id: 'deadlift', name: 'Soulevé de terre', pattern: 'hinge', muscles: ['hamstrings', 'glutes', 'back', 'traps'], equipment: ['gym'], minLevel: L('intermediate'), stress: ['lower_back', 'hip'], repRange: [4, 6], compound: true, lowerBody: true, cues: 'Barre proche des tibias, dos neutre, pousse le sol.' },
  { id: 'romanian_deadlift', name: 'Soulevé de terre roumain', pattern: 'hinge', muscles: ['hamstrings', 'glutes', 'back'], equipment: ['gym', 'home_basic'], minLevel: L('beginner'), stress: ['lower_back', 'hip'], repRange: [8, 12], compound: true, lowerBody: true, cues: 'Hanches en arrière, barre le long des cuisses, étirement des ischios.' },
  { id: 'hip_thrust', name: 'Hip thrust', pattern: 'hinge', muscles: ['glutes', 'hamstrings'], equipment: ['gym', 'home_basic'], minLevel: L('beginner'), stress: ['hip'], repRange: [8, 12], compound: true, lowerBody: true, cues: 'Menton rentré, contraction complète en haut.' },
  { id: 'glute_bridge', name: 'Pont fessier (poids du corps / unilatéral)', pattern: 'hinge', muscles: ['glutes', 'hamstrings'], equipment: ['home_none'], minLevel: L('beginner'), stress: [], repRange: [12, 20], compound: true, lowerBody: true, cues: 'Une jambe pour augmenter la difficulté.' },
  // Lunge
  { id: 'split_squat', name: 'Fentes bulgares / split squat', pattern: 'lunge', muscles: ['quads', 'glutes'], equipment: ['gym', 'home_basic', 'home_none'], minLevel: L('beginner'), stress: ['knee', 'hip'], repRange: [8, 12], compound: true, lowerBody: true, cues: 'Torse droit, genou avant suit l’orientation du pied.' },
  { id: 'walking_lunge', name: 'Fentes marchées', pattern: 'lunge', muscles: ['quads', 'glutes'], equipment: ['gym', 'home_basic', 'home_none'], minLevel: L('beginner'), stress: ['knee'], repRange: [10, 16], compound: true, lowerBody: true, cues: 'Pas longs, contrôle de la descente.' },
  // Horizontal push
  { id: 'bench_press', name: 'Développé couché barre', pattern: 'horizontal_push', muscles: ['chest', 'front_delts', 'triceps'], equipment: ['gym'], minLevel: L('intermediate'), stress: ['shoulder', 'elbow', 'wrist'], repRange: [5, 8], compound: true, lowerBody: false, cues: 'Omoplates serrées, pieds ancrés, barre au bas de la poitrine.' },
  { id: 'db_bench', name: 'Développé haltères (plat ou incliné)', pattern: 'horizontal_push', muscles: ['chest', 'front_delts', 'triceps'], equipment: ['gym', 'home_basic'], minLevel: L('beginner'), stress: ['shoulder', 'elbow'], repRange: [8, 12], compound: true, lowerBody: false, cues: 'Coudes à ~45°, amplitude complète.' },
  { id: 'push_up', name: 'Pompes (lestées, surélevées ou déclinées)', pattern: 'horizontal_push', muscles: ['chest', 'front_delts', 'triceps', 'core'], equipment: ['home_none', 'home_basic', 'gym'], minLevel: L('beginner'), stress: ['shoulder', 'wrist'], repRange: [8, 20], compound: true, lowerBody: false, cues: 'Corps gainé, pieds surélevés pour progresser.' },
  { id: 'chest_press_machine', name: 'Presse pectoraux machine', pattern: 'horizontal_push', muscles: ['chest', 'triceps'], equipment: ['gym'], minLevel: L('beginner'), stress: ['shoulder'], repRange: [8, 12], compound: true, lowerBody: false, cues: 'Réglage siège : poignées au niveau du milieu de la poitrine.' },
  // Vertical push
  { id: 'overhead_press', name: 'Développé militaire barre', pattern: 'vertical_push', muscles: ['front_delts', 'side_delts', 'triceps'], equipment: ['gym'], minLevel: L('intermediate'), stress: ['shoulder', 'lower_back'], repRange: [5, 8], compound: true, lowerBody: false, cues: 'Gainage, barre en ligne droite, tête qui passe sous la barre.' },
  { id: 'db_shoulder_press', name: 'Développé épaules haltères', pattern: 'vertical_push', muscles: ['front_delts', 'side_delts', 'triceps'], equipment: ['gym', 'home_basic'], minLevel: L('beginner'), stress: ['shoulder'], repRange: [8, 12], compound: true, lowerBody: false, cues: 'Assis ou debout, coudes légèrement devant.' },
  { id: 'pike_push_up', name: 'Pompes piquées', pattern: 'vertical_push', muscles: ['front_delts', 'triceps'], equipment: ['home_none'], minLevel: L('beginner'), stress: ['shoulder', 'wrist'], repRange: [8, 15], compound: true, lowerBody: false, cues: 'Hanches hautes, tête vers le sol devant les mains.' },
  // Horizontal pull
  { id: 'row_barbell', name: 'Rowing barre', pattern: 'horizontal_pull', muscles: ['back', 'lats', 'rear_delts', 'biceps'], equipment: ['gym'], minLevel: L('intermediate'), stress: ['lower_back'], repRange: [6, 10], compound: true, lowerBody: false, cues: 'Dos neutre, tire vers le bas du ventre.' },
  { id: 'db_row', name: 'Rowing haltère unilatéral', pattern: 'horizontal_pull', muscles: ['back', 'lats', 'biceps'], equipment: ['gym', 'home_basic'], minLevel: L('beginner'), stress: [], repRange: [8, 12], compound: true, lowerBody: false, cues: 'Coude vers la hanche, pas de rotation du torse.' },
  { id: 'seated_row', name: 'Tirage horizontal poulie', pattern: 'horizontal_pull', muscles: ['back', 'lats', 'biceps'], equipment: ['gym'], minLevel: L('beginner'), stress: [], repRange: [8, 12], compound: true, lowerBody: false, cues: 'Omoplates qui se serrent en fin de mouvement.' },
  { id: 'inverted_row', name: 'Rowing inversé (table, barre basse, anneaux)', pattern: 'horizontal_pull', muscles: ['back', 'lats', 'biceps'], equipment: ['home_none', 'home_basic'], minLevel: L('beginner'), stress: [], repRange: [8, 15], compound: true, lowerBody: false, cues: 'Corps gainé, poitrine vers la barre.' },
  // Vertical pull
  { id: 'pull_up', name: 'Tractions (lestées ou assistées)', pattern: 'vertical_pull', muscles: ['lats', 'back', 'biceps'], equipment: ['gym', 'home_basic'], minLevel: L('beginner'), stress: ['shoulder', 'elbow'], repRange: [5, 10], compound: true, lowerBody: false, cues: 'Départ bras tendus, poitrine vers la barre.' },
  { id: 'lat_pulldown', name: 'Tirage vertical poulie', pattern: 'vertical_pull', muscles: ['lats', 'back', 'biceps'], equipment: ['gym'], minLevel: L('beginner'), stress: ['shoulder'], repRange: [8, 12], compound: true, lowerBody: false, cues: 'Torse légèrement incliné, coudes vers les hanches.' },
  { id: 'band_pulldown', name: 'Tirage élastique', pattern: 'vertical_pull', muscles: ['lats', 'back'], equipment: ['home_none', 'home_basic'], minLevel: L('beginner'), stress: [], repRange: [12, 20], compound: true, lowerBody: false, cues: 'Élastique fixé en hauteur.' },
  // Isolations
  { id: 'lateral_raise', name: 'Élévations latérales', pattern: 'iso_shoulders', muscles: ['side_delts'], equipment: ['gym', 'home_basic'], minLevel: L('beginner'), stress: ['shoulder'], repRange: [12, 20], compound: false, lowerBody: false, cues: 'Légère inclinaison vers l’avant, coudes guident le mouvement.' },
  { id: 'face_pull', name: 'Face pull (poulie ou élastique)', pattern: 'iso_shoulders', muscles: ['rear_delts', 'traps'], equipment: ['gym', 'home_basic', 'home_none'], minLevel: L('beginner'), stress: [], repRange: [12, 20], compound: false, lowerBody: false, cues: 'Tire vers le visage, rotation externe en fin.' },
  { id: 'biceps_curl', name: 'Curl biceps (haltères/barre)', pattern: 'iso_arms_biceps', muscles: ['biceps'], equipment: ['gym', 'home_basic'], minLevel: L('beginner'), stress: ['elbow'], repRange: [8, 15], compound: false, lowerBody: false, cues: 'Coudes fixes, contrôle de la descente.' },
  { id: 'triceps_extension', name: 'Extension triceps (poulie/haltère)', pattern: 'iso_arms_triceps', muscles: ['triceps'], equipment: ['gym', 'home_basic'], minLevel: L('beginner'), stress: ['elbow'], repRange: [10, 15], compound: false, lowerBody: false, cues: 'Coudes près du corps.' },
  { id: 'dips_bench', name: 'Dips sur banc / chaise', pattern: 'iso_arms_triceps', muscles: ['triceps', 'chest'], equipment: ['home_none'], minLevel: L('beginner'), stress: ['shoulder', 'elbow'], repRange: [10, 20], compound: false, lowerBody: false, cues: 'Épaules basses, amplitude confortable.' },
  { id: 'leg_curl', name: 'Leg curl', pattern: 'iso_legs', muscles: ['hamstrings'], equipment: ['gym'], minLevel: L('beginner'), stress: ['knee'], repRange: [10, 15], compound: false, lowerBody: true, cues: 'Contrôle de la phase excentrique.' },
  { id: 'leg_extension', name: 'Leg extension', pattern: 'iso_legs', muscles: ['quads'], equipment: ['gym'], minLevel: L('beginner'), stress: ['knee'], repRange: [10, 15], compound: false, lowerBody: true, cues: 'Pause 1 s en haut.' },
  { id: 'calf_raise', name: 'Mollets debout', pattern: 'iso_calves', muscles: ['calves'], equipment: ['gym', 'home_basic', 'home_none'], minLevel: L('beginner'), stress: ['ankle'], repRange: [10, 15], compound: false, lowerBody: true, cues: 'Étirement complet en bas, pause en haut.' },
  // Core
  { id: 'plank', name: 'Gainage (planche, variantes)', pattern: 'core', muscles: ['core'], equipment: ['gym', 'home_basic', 'home_none'], minLevel: L('beginner'), stress: ['shoulder'], repRange: [30, 60], compound: false, lowerBody: false, cues: 'En secondes. Bassin neutre, fessiers serrés.' },
  { id: 'dead_bug', name: 'Dead bug / hollow hold', pattern: 'core', muscles: ['core'], equipment: ['gym', 'home_basic', 'home_none'], minLevel: L('beginner'), stress: [], repRange: [10, 16], compound: false, lowerBody: false, cues: 'Bas du dos plaqué au sol.' },
  { id: 'cable_crunch', name: 'Crunch poulie / relevé de jambes', pattern: 'core', muscles: ['core'], equipment: ['gym', 'home_basic'], minLevel: L('beginner'), stress: ['lower_back'], repRange: [10, 15], compound: false, lowerBody: false, cues: 'Enroulement du tronc, pas de traction des bras.' },
  { id: 'farmer_carry', name: 'Farmer carry', pattern: 'carry', muscles: ['forearms', 'traps', 'core'], equipment: ['gym', 'home_basic'], minLevel: L('beginner'), stress: [], repRange: [30, 60], compound: true, lowerBody: false, cues: 'En secondes ou mètres. Épaules basses, pas rapides.' },
];

export const EXERCISE_BY_ID: Record<string, Exercise> = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));

const LEVEL_RANK: Record<TrainingLevel, number> = { beginner: 0, intermediate: 1, advanced: 2 };

export function levelAtLeast(a: TrainingLevel, b: TrainingLevel): boolean {
  return LEVEL_RANK[a] >= LEVEL_RANK[b];
}

/** Exercices faisables pour un pattern donné, selon matériel, niveau et limitations. */
export function candidates(pattern: MovementPattern, equipment: Equipment, level: TrainingLevel, excludedRegions: BodyRegion[]): Exercise[] {
  return EXERCISES.filter(
    (e) => e.pattern === pattern && e.equipment.includes(equipment) && levelAtLeast(level, e.minLevel) && !e.stress.some((r) => excludedRegions.includes(r)),
  );
}

export function substitutesFor(exerciseId: string, equipment: Equipment, level: TrainingLevel, excludedRegions: BodyRegion[]): Exercise[] {
  const ex = EXERCISE_BY_ID[exerciseId];
  if (!ex) return [];
  return candidates(ex.pattern, equipment, level, excludedRegions).filter((e) => e.id !== exerciseId);
}
