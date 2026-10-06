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
  /** 2–3 étapes d'exécution, pour un débutant */
  steps?: string[];
  /** erreurs fréquentes */
  mistakes?: string[];
}

const L = (lvl: TrainingLevel) => lvl;

export const EXERCISES: Exercise[] = [
  // Squat
  { id: 'squat', name: 'Squat barre', pattern: 'squat', muscles: ['quads', 'glutes', 'core'], equipment: ['gym'], minLevel: L('intermediate'), stress: ['knee', 'lower_back', 'hip'], repRange: [5, 8], compound: true, lowerBody: true, cues: 'Pieds largeur d’épaules, descends contrôlé, pousse le sol.', steps: ['Barre sur les trapèzes, pieds largeur d’épaules, pointes légèrement ouvertes.', 'Inspire, descends en poussant les genoux vers l’extérieur jusqu’à cuisses parallèles ou plus bas.', 'Pousse le sol, expire en remontant, dos neutre tout du long.'], mistakes: ['Talons qui décollent', 'Genoux qui rentrent', 'Dos qui s’arrondit en bas'] },
  { id: 'goblet_squat', name: 'Goblet squat (haltère/kettlebell)', pattern: 'squat', muscles: ['quads', 'glutes', 'core'], equipment: ['gym', 'home_basic'], minLevel: L('beginner'), stress: ['knee', 'hip'], repRange: [8, 12], compound: true, lowerBody: true, cues: 'Haltère contre la poitrine, coudes vers l’intérieur des genoux.', steps: ['Tiens l’haltère vertical contre la poitrine, coudes sous la charge.', 'Descends entre tes jambes, coudes vers l’intérieur des genoux.', 'Remonte en poussant le sol, torse droit.'], mistakes: ['Charge qui s’éloigne du corps', 'Descente trop courte'] },
  { id: 'leg_press', name: 'Presse à cuisses', pattern: 'squat', muscles: ['quads', 'glutes'], equipment: ['gym'], minLevel: L('beginner'), stress: ['knee'], repRange: [8, 12], compound: true, lowerBody: true, cues: 'Amplitude complète sans décoller le bassin.', steps: ['Pieds à plat, largeur d’épaules, au milieu de la plateforme.', 'Descends jusqu’à 90° sans que le bassin décolle du dossier.', 'Pousse sans verrouiller brutalement les genoux.'], mistakes: ['Bassin qui se décolle en bas', 'Genoux verrouillés en haut'] },
  { id: 'bodyweight_squat', name: 'Squat au poids du corps / pistol assisté', pattern: 'squat', muscles: ['quads', 'glutes'], equipment: ['home_none', 'home_basic'], minLevel: L('beginner'), stress: ['knee'], repRange: [12, 20], compound: true, lowerBody: true, cues: 'Tempo lent, pause en bas pour augmenter la difficulté.', steps: ['Pieds largeur d’épaules, bras devant.', 'Descends lentement (3 s), pause 1 s en bas.', 'Remonte en serrant les fessiers.'], mistakes: ['Descente trop rapide', 'Talons qui décollent'] },
  // Hinge
  { id: 'deadlift', name: 'Soulevé de terre', pattern: 'hinge', muscles: ['hamstrings', 'glutes', 'back', 'traps'], equipment: ['gym'], minLevel: L('intermediate'), stress: ['lower_back', 'hip'], repRange: [4, 6], compound: true, lowerBody: true, cues: 'Barre proche des tibias, dos neutre, pousse le sol.', steps: ['Barre au-dessus du milieu du pied, tibias proches, dos neutre, poitrine haute.', 'Pousse le sol avec les jambes, la barre monte le long des tibias.', 'Verrouille les hanches en haut sans te pencher en arrière.'], mistakes: ['Dos arrondi', 'Barre qui s’éloigne des jambes', 'Hanches qui montent avant les épaules'] },
  { id: 'romanian_deadlift', name: 'Soulevé de terre roumain', pattern: 'hinge', muscles: ['hamstrings', 'glutes', 'back'], equipment: ['gym', 'home_basic'], minLevel: L('beginner'), stress: ['lower_back', 'hip'], repRange: [8, 12], compound: true, lowerBody: true, cues: 'Hanches en arrière, barre le long des cuisses, étirement des ischios.', steps: ['Debout, barre contre les cuisses, genoux légèrement fléchis.', 'Hanches en arrière, barre qui glisse le long des cuisses, jusqu’à sentir l’étirement des ischios.', 'Reviens en serrant les fessiers.'], mistakes: ['Genoux qui fléchissent trop (ça devient un squat)', 'Dos qui s’arrondit'] },
  { id: 'hip_thrust', name: 'Hip thrust', pattern: 'hinge', muscles: ['glutes', 'hamstrings'], equipment: ['gym', 'home_basic'], minLevel: L('beginner'), stress: ['hip'], repRange: [8, 12], compound: true, lowerBody: true, cues: 'Menton rentré, contraction complète en haut.', steps: ['Haut du dos sur un banc, barre sur les hanches, pieds à plat.', 'Pousse les hanches vers le haut jusqu’à l’alignement épaules-genoux.', 'Menton rentré, serre 1 s en haut.'], mistakes: ['Cambrure lombaire en haut', 'Pieds trop loin du bassin'] },
  { id: 'glute_bridge', name: 'Pont fessier (poids du corps / unilatéral)', pattern: 'hinge', muscles: ['glutes', 'hamstrings'], equipment: ['home_none'], minLevel: L('beginner'), stress: [], repRange: [12, 20], compound: true, lowerBody: true, cues: 'Une jambe pour augmenter la difficulté.', steps: ['Allongé, pieds à plat proches des fesses.', 'Pousse les hanches vers le haut, serre les fessiers.', 'Une jambe tendue pour durcir.'], mistakes: ['Pousser avec le bas du dos'] },
  // Lunge
  { id: 'split_squat', name: 'Fentes bulgares / split squat', pattern: 'lunge', muscles: ['quads', 'glutes'], equipment: ['gym', 'home_basic', 'home_none'], minLevel: L('beginner'), stress: ['knee', 'hip'], repRange: [8, 12], compound: true, lowerBody: true, cues: 'Torse droit, genou avant suit l’orientation du pied.', steps: ['Un pied devant, l’autre derrière (sur un banc pour la version bulgare).', 'Descends verticalement jusqu’à ce que le genou arrière frôle le sol.', 'Remonte en poussant dans le talon avant.'], mistakes: ['Genou avant qui rentre', 'Torse qui se penche trop'] },
  { id: 'walking_lunge', name: 'Fentes marchées', pattern: 'lunge', muscles: ['quads', 'glutes'], equipment: ['gym', 'home_basic', 'home_none'], minLevel: L('beginner'), stress: ['knee'], repRange: [10, 16], compound: true, lowerBody: true, cues: 'Pas longs, contrôle de la descente.', steps: ['Grand pas en avant, torse droit.', 'Descends jusqu’à 90° aux deux genoux.', 'Pousse dans le talon avant pour enchaîner.'], mistakes: ['Pas trop courts', 'Genou qui dépasse trop la pointe du pied'] },
  // Horizontal push
  { id: 'bench_press', name: 'Développé couché barre', pattern: 'horizontal_push', muscles: ['chest', 'front_delts', 'triceps'], equipment: ['gym'], minLevel: L('intermediate'), stress: ['shoulder', 'elbow', 'wrist'], repRange: [5, 8], compound: true, lowerBody: false, cues: 'Omoplates serrées, pieds ancrés, barre au bas de la poitrine.', steps: ['Omoplates serrées, pieds ancrés, prise un peu plus large que les épaules.', 'Descends la barre sur le bas de la poitrine, coudes à ~45°.', 'Pousse en expirant, sans décoller les fesses.'], mistakes: ['Coudes à 90° (épaules exposées)', 'Rebond sur la poitrine', 'Fesses qui décollent'] },
  { id: 'db_bench', name: 'Développé haltères (plat ou incliné)', pattern: 'horizontal_push', muscles: ['chest', 'front_delts', 'triceps'], equipment: ['gym', 'home_basic'], minLevel: L('beginner'), stress: ['shoulder', 'elbow'], repRange: [8, 12], compound: true, lowerBody: false, cues: 'Coudes à ~45°, amplitude complète.', steps: ['Allongé, haltères au-dessus des épaules, omoplates serrées.', 'Descends jusqu’à sentir l’étirement des pectoraux.', 'Pousse en rapprochant légèrement les haltères en haut.'], mistakes: ['Amplitude trop courte', 'Haltères qui partent vers l’extérieur'] },
  { id: 'push_up', name: 'Pompes (lestées, surélevées ou déclinées)', pattern: 'horizontal_push', muscles: ['chest', 'front_delts', 'triceps', 'core'], equipment: ['home_none', 'home_basic', 'gym'], minLevel: L('beginner'), stress: ['shoulder', 'wrist'], repRange: [8, 20], compound: true, lowerBody: false, cues: 'Corps gainé, pieds surélevés pour progresser.', steps: ['Mains sous les épaules, corps gainé en ligne.', 'Descends jusqu’à frôler le sol, coudes à ~45°.', 'Pousse en gardant le bassin aligné.'], mistakes: ['Bassin qui tombe ou qui monte', 'Tête qui plonge en avant'] },
  { id: 'chest_press_machine', name: 'Presse pectoraux machine', pattern: 'horizontal_push', muscles: ['chest', 'triceps'], equipment: ['gym'], minLevel: L('beginner'), stress: ['shoulder'], repRange: [8, 12], compound: true, lowerBody: false, cues: 'Réglage siège : poignées au niveau du milieu de la poitrine.', steps: ['Règle le siège : poignées au niveau du milieu de la poitrine.', 'Pousse en expirant, sans verrouiller les coudes.', 'Reviens lentement.'], mistakes: ['Siège mal réglé', 'Épaules qui remontent'] },
  // Vertical push
  { id: 'overhead_press', name: 'Développé militaire barre', pattern: 'vertical_push', muscles: ['front_delts', 'side_delts', 'triceps'], equipment: ['gym'], minLevel: L('intermediate'), stress: ['shoulder', 'lower_back'], repRange: [5, 8], compound: true, lowerBody: false, cues: 'Gainage, barre en ligne droite, tête qui passe sous la barre.', steps: ['Barre sur les clavicules, prise largeur d’épaules, fessiers serrés.', 'Pousse en ligne droite, recule légèrement la tête pour laisser passer la barre.', 'Verrouille au-dessus de la tête, tête qui repasse sous la barre.'], mistakes: ['Cambrure lombaire excessive', 'Barre qui part devant'] },
  { id: 'db_shoulder_press', name: 'Développé épaules haltères', pattern: 'vertical_push', muscles: ['front_delts', 'side_delts', 'triceps'], equipment: ['gym', 'home_basic'], minLevel: L('beginner'), stress: ['shoulder'], repRange: [8, 12], compound: true, lowerBody: false, cues: 'Assis ou debout, coudes légèrement devant.', steps: ['Assis ou debout, haltères au niveau des oreilles, coudes légèrement devant.', 'Pousse jusqu’à presque tendre les bras.', 'Redescends sous contrôle.'], mistakes: ['Haltères qui partent en arrière', 'Cambrure du bas du dos'] },
  { id: 'pike_push_up', name: 'Pompes piquées', pattern: 'vertical_push', muscles: ['front_delts', 'triceps'], equipment: ['home_none'], minLevel: L('beginner'), stress: ['shoulder', 'wrist'], repRange: [8, 15], compound: true, lowerBody: false, cues: 'Hanches hautes, tête vers le sol devant les mains.', steps: ['Position en V inversé, hanches hautes.', 'Fléchis les bras pour amener la tête devant les mains.', 'Pousse pour revenir.'], mistakes: ['Hanches qui descendent', 'Coudes trop écartés'] },
  // Horizontal pull
  { id: 'row_barbell', name: 'Rowing barre', pattern: 'horizontal_pull', muscles: ['back', 'lats', 'rear_delts', 'biceps'], equipment: ['gym'], minLevel: L('intermediate'), stress: ['lower_back'], repRange: [6, 10], compound: true, lowerBody: false, cues: 'Dos neutre, tire vers le bas du ventre.', steps: ['Barre en mains, buste incliné à ~45°, dos neutre.', 'Tire vers le bas du ventre, coudes le long du corps.', 'Redescends sous contrôle sans arrondir.'], mistakes: ['Buste qui se redresse à chaque rep', 'Dos arrondi'] },
  { id: 'db_row', name: 'Rowing haltère unilatéral', pattern: 'horizontal_pull', muscles: ['back', 'lats', 'biceps'], equipment: ['gym', 'home_basic'], minLevel: L('beginner'), stress: [], repRange: [8, 12], compound: true, lowerBody: false, cues: 'Coude vers la hanche, pas de rotation du torse.', steps: ['Main et genou sur le banc, dos plat.', 'Tire l’haltère vers la hanche, coude près du corps.', 'Descends jusqu’à l’étirement complet.'], mistakes: ['Rotation du torse', 'Tirer vers l’épaule au lieu de la hanche'] },
  { id: 'seated_row', name: 'Tirage horizontal poulie', pattern: 'horizontal_pull', muscles: ['back', 'lats', 'biceps'], equipment: ['gym'], minLevel: L('beginner'), stress: [], repRange: [8, 12], compound: true, lowerBody: false, cues: 'Omoplates qui se serrent en fin de mouvement.', steps: ['Assis, poitrine haute, bras tendus.', 'Tire vers le nombril en serrant les omoplates.', 'Reviens lentement.'], mistakes: ['Se pencher en arrière pour tirer', 'Épaules qui montent'] },
  { id: 'inverted_row', name: 'Rowing inversé (table, barre basse, anneaux)', pattern: 'horizontal_pull', muscles: ['back', 'lats', 'biceps'], equipment: ['home_none', 'home_basic'], minLevel: L('beginner'), stress: [], repRange: [8, 15], compound: true, lowerBody: false, cues: 'Corps gainé, poitrine vers la barre.', steps: ['Sous une barre ou une table, corps en ligne.', 'Tire la poitrine vers la barre.', 'Descends sous contrôle.'], mistakes: ['Bassin qui tombe', 'Amplitude trop courte'] },
  // Vertical pull
  { id: 'pull_up', name: 'Tractions (lestées ou assistées)', pattern: 'vertical_pull', muscles: ['lats', 'back', 'biceps'], equipment: ['gym', 'home_basic'], minLevel: L('beginner'), stress: ['shoulder', 'elbow'], repRange: [5, 10], compound: true, lowerBody: false, cues: 'Départ bras tendus, poitrine vers la barre.', steps: ['Suspendu, bras tendus, omoplates basses.', 'Tire la poitrine vers la barre, coudes vers les hanches.', 'Descends complètement.'], mistakes: ['Balancier', 'Demi-répétitions'] },
  { id: 'lat_pulldown', name: 'Tirage vertical poulie', pattern: 'vertical_pull', muscles: ['lats', 'back', 'biceps'], equipment: ['gym'], minLevel: L('beginner'), stress: ['shoulder'], repRange: [8, 12], compound: true, lowerBody: false, cues: 'Torse légèrement incliné, coudes vers les hanches.', steps: ['Assis, cuisses bloquées, prise un peu plus large que les épaules.', 'Tire la barre vers le haut de la poitrine, coudes vers les hanches.', 'Remonte jusqu’à l’étirement complet.'], mistakes: ['Se pencher trop en arrière', 'Tirer derrière la nuque'] },
  { id: 'band_pulldown', name: 'Tirage élastique', pattern: 'vertical_pull', muscles: ['lats', 'back'], equipment: ['home_none', 'home_basic'], minLevel: L('beginner'), stress: [], repRange: [12, 20], compound: true, lowerBody: false, cues: 'Élastique fixé en hauteur.', steps: ['Élastique fixé en hauteur, à genoux ou assis.', 'Tire les coudes vers les hanches.', 'Reviens lentement.'], mistakes: ['Épaules qui montent'] },
  // Isolations
  { id: 'lateral_raise', name: 'Élévations latérales', pattern: 'iso_shoulders', muscles: ['side_delts'], equipment: ['gym', 'home_basic'], minLevel: L('beginner'), stress: ['shoulder'], repRange: [12, 20], compound: false, lowerBody: false, cues: 'Légère inclinaison vers l’avant, coudes guident le mouvement.', steps: ['Haltères le long du corps, légère inclinaison du buste.', 'Monte les coudes jusqu’à l’horizontale, mains sous les coudes.', 'Descends en 2–3 s.'], mistakes: ['Élan avec le buste', 'Charge trop lourde, épaules qui montent'] },
  { id: 'face_pull', name: 'Face pull (poulie ou élastique)', pattern: 'iso_shoulders', muscles: ['rear_delts', 'traps'], equipment: ['gym', 'home_basic', 'home_none'], minLevel: L('beginner'), stress: [], repRange: [12, 20], compound: false, lowerBody: false, cues: 'Tire vers le visage, rotation externe en fin.', steps: ['Corde à hauteur du visage, prise paumes vers l’intérieur.', 'Tire vers le visage en écartant les mains, coudes hauts.', 'Rotation externe en fin de mouvement.'], mistakes: ['Trop lourd, buste qui recule'] },
  { id: 'biceps_curl', name: 'Curl biceps (haltères/barre)', pattern: 'iso_arms_biceps', muscles: ['biceps'], equipment: ['gym', 'home_basic'], minLevel: L('beginner'), stress: ['elbow'], repRange: [8, 15], compound: false, lowerBody: false, cues: 'Coudes fixes, contrôle de la descente.', steps: ['Coudes fixes le long du corps.', 'Monte en contractant, sans balancer.', 'Descends en 2–3 s.'], mistakes: ['Balancier du buste', 'Coudes qui avancent'] },
  { id: 'triceps_extension', name: 'Extension triceps (poulie/haltère)', pattern: 'iso_arms_triceps', muscles: ['triceps'], equipment: ['gym', 'home_basic'], minLevel: L('beginner'), stress: ['elbow'], repRange: [10, 15], compound: false, lowerBody: false, cues: 'Coudes près du corps.', steps: ['Coudes près du corps ou fixes au-dessus de la tête.', 'Tends les bras complètement.', 'Reviens sous contrôle.'], mistakes: ['Coudes qui s’écartent', 'Épaules qui bougent'] },
  { id: 'dips_bench', name: 'Dips sur banc / chaise', pattern: 'iso_arms_triceps', muscles: ['triceps', 'chest'], equipment: ['home_none'], minLevel: L('beginner'), stress: ['shoulder', 'elbow'], repRange: [10, 20], compound: false, lowerBody: false, cues: 'Épaules basses, amplitude confortable.', steps: ['Mains sur le banc derrière toi, jambes tendues devant.', 'Descends jusqu’à 90° aux coudes.', 'Pousse pour remonter, épaules basses.'], mistakes: ['Descendre trop bas (épaules)', 'Épaules qui remontent vers les oreilles'] },
  { id: 'leg_curl', name: 'Leg curl', pattern: 'iso_legs', muscles: ['hamstrings'], equipment: ['gym'], minLevel: L('beginner'), stress: ['knee'], repRange: [10, 15], compound: false, lowerBody: true, cues: 'Contrôle de la phase excentrique.', steps: ['Coussin au-dessus des chevilles.', 'Fléchis en contractant les ischios.', 'Reviens en 2–3 s.'], mistakes: ['Bassin qui décolle'] },
  { id: 'leg_extension', name: 'Leg extension', pattern: 'iso_legs', muscles: ['quads'], equipment: ['gym'], minLevel: L('beginner'), stress: ['knee'], repRange: [10, 15], compound: false, lowerBody: true, cues: 'Pause 1 s en haut.', steps: ['Coussin sur les chevilles, dos contre le dossier.', 'Tends les jambes, pause 1 s en haut.', 'Reviens sous contrôle.'], mistakes: ['Mouvement trop rapide'] },
  { id: 'calf_raise', name: 'Mollets debout', pattern: 'iso_calves', muscles: ['calves'], equipment: ['gym', 'home_basic', 'home_none'], minLevel: L('beginner'), stress: ['ankle'], repRange: [10, 15], compound: false, lowerBody: true, cues: 'Étirement complet en bas, pause en haut.', steps: ['Avant-pieds sur une marche.', 'Monte sur la pointe, pause 1 s.', 'Descends jusqu’à l’étirement complet.'], mistakes: ['Rebonds', 'Amplitude courte'] },
  // Core
  { id: 'plank', name: 'Gainage (planche, variantes)', pattern: 'core', muscles: ['core'], equipment: ['gym', 'home_basic', 'home_none'], minLevel: L('beginner'), stress: ['shoulder'], repRange: [30, 60], compound: false, lowerBody: false, cues: 'En secondes. Bassin neutre, fessiers serrés.', steps: ['Coudes sous les épaules, corps en ligne.', 'Serre fessiers et abdos, respire.', 'Tiens le temps prévu sans laisser tomber le bassin.'], mistakes: ['Bassin qui tombe ou qui monte', 'Apnée'] },
  { id: 'dead_bug', name: 'Dead bug / hollow hold', pattern: 'core', muscles: ['core'], equipment: ['gym', 'home_basic', 'home_none'], minLevel: L('beginner'), stress: [], repRange: [10, 16], compound: false, lowerBody: false, cues: 'Bas du dos plaqué au sol.', steps: ['Allongé, bras vers le plafond, genoux à 90°.', 'Tends un bras et la jambe opposée sans décoller le bas du dos.', 'Reviens, alterne.'], mistakes: ['Bas du dos qui se cambre'] },
  { id: 'cable_crunch', name: 'Crunch poulie / relevé de jambes', pattern: 'core', muscles: ['core'], equipment: ['gym', 'home_basic'], minLevel: L('beginner'), stress: ['lower_back'], repRange: [10, 15], compound: false, lowerBody: false, cues: 'Enroulement du tronc, pas de traction des bras.', steps: ['À genoux, corde derrière la tête.', 'Enroule le tronc vers le bas, coudes vers les cuisses.', 'Remonte sous contrôle.'], mistakes: ['Tirer avec les bras', 'Hanches qui bougent'] },
  { id: 'farmer_carry', name: 'Farmer carry', pattern: 'carry', muscles: ['forearms', 'traps', 'core'], equipment: ['gym', 'home_basic'], minLevel: L('beginner'), stress: [], repRange: [30, 60], compound: true, lowerBody: false, cues: 'En secondes ou mètres. Épaules basses, pas rapides.', steps: ['Haltères lourds, épaules basses, regard devant.', 'Marche à pas courts et rapides.', 'Pose sans arrondir le dos.'], mistakes: ['Épaules qui montent', 'Pas trop longs'] },
];

export const PATTERN_LABEL: Record<MovementPattern, string> = { squat: 'Squat', hinge: 'Charnière de hanche', lunge: 'Fente / unilatéral', horizontal_push: 'Poussée horizontale', vertical_push: 'Poussée verticale', horizontal_pull: 'Tirage horizontal', vertical_pull: 'Tirage vertical', core: 'Gainage', iso_shoulders: 'Épaules (isolation)', iso_arms_biceps: 'Biceps', iso_arms_triceps: 'Triceps', iso_legs: 'Jambes (isolation)', iso_calves: 'Mollets', carry: 'Port de charge' };
export const MUSCLE_LABEL: Record<Muscle, string> = { quads: 'Quadriceps', glutes: 'Fessiers', hamstrings: 'Ischio-jambiers', calves: 'Mollets', chest: 'Pectoraux', back: 'Dos (milieu)', lats: 'Grands dorsaux', traps: 'Trapèzes', front_delts: 'Épaules (avant)', side_delts: 'Épaules (côté)', rear_delts: 'Épaules (arrière)', biceps: 'Biceps', triceps: 'Triceps', core: 'Abdominaux / gainage', forearms: 'Avant-bras' };

/** Lien de démonstration vidéo (recherche), sans dépendre d'un contenu sous licence. */
export function demoVideoUrl(ex: Exercise): string {
  return 'https://www.youtube.com/results?search_query=' + encodeURIComponent(`${ex.name} technique exécution`);
}

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
