import type { DailyCheckin, ISODate, Measurement, PerformanceLog, Profile, UserState, WorkoutSession } from './types';
import { addDays, dayOfWeek, round, seeded } from './stats';
import { generateProgram } from './training/program';

/**
 * CAS FONDATEUR — Homme, 1,92 m, 93 kg, activité pro importante, graisse abdominale,
 * veut garder sa carrure et se densifier. 8 semaines d'historique simulé, déterministe.
 * Trajectoire volontairement « recomposition » : poids quasi stable, taille en baisse, force en hausse.
 */
export function demoProfile(createdAt: ISODate): Profile {
  return {
    id: 'demo_user',
    createdAt,
    displayName: 'Yann',
    sex: 'male',
    age: 36,
    heightCm: 192,
    startWeightKg: 93,
    level: 'intermediate',
    yearsTraining: 3,
    sessionsPerWeek: 3,
    sessionMinutes: 50,
    equipment: 'gym',
    occupation: 'light',
    workHoursPerWeek: 55,
    stepsPerDay: 6500,
    goals: ['recomposition', 'muscle_gain', 'definition', 'energy'],
    primaryGoal: 'recomposition',
    visualGoals: ['defined', 'athletic', 'flat_stomach', 'wider_shoulders'],
    fatStorage: ['abdomen'],
    priorityStatement: 'Être plus dessiné sans perdre ma carrure, et avoir plus d’énergie.',
    mode: 'busy',
    nutritionPrecision: 'precise',
    foodCultures: ['west_africa', 'europe'],
    dietaryPreferences: [],
    allergies: [],
    dislikedFoods: [],
    limitations: [],
    risk: {},
    consents: { photoAiAnalysis: false, productImprovement: false, notifications: true },
    traits: { allOrNothing: true, decisionFatigue: true },
    fastingWindow: null,
    mealsPerDay: 4,
    trainingTimeOfDay: 'evening',
    trainingDays: [1, 3, 5],
  };
}

export function buildDemoState(today: ISODate, weeks = 8): UserState {
  const rnd = seeded(42);
  const start = addDays(today, -weeks * 7);
  const profile = demoProfile(start);
  const program = generateProgram(profile);
  const measurements: Measurement[] = [];
  const checkins: DailyCheckin[] = [];
  const sessions: WorkoutSession[] = [];
  const performance: PerformanceLog[] = [];

  // Charges de départ (kg) pour les exercices du programme
  const startLoad: Record<string, number> = { squat: 80, bench_press: 70, row_barbell: 60, deadlift: 100, overhead_press: 42.5, pull_up: 0, lat_pulldown: 55, romanian_deadlift: 70, db_bench: 26, goblet_squat: 24, leg_press: 140, hip_thrust: 90, split_squat: 16, walking_lunge: 14, db_row: 28, seated_row: 55, db_shoulder_press: 18, lateral_raise: 8, face_pull: 15, biceps_curl: 12, triceps_extension: 20, leg_curl: 40, leg_extension: 45, calf_raise: 60, plank: 0, dead_bug: 0, cable_crunch: 30, farmer_carry: 24 };
  const load: Record<string, number> = { ...startLoad };
  const repsState: Record<string, number> = {};

  const totalDays = weeks * 7;
  for (let i = 0; i <= totalDays; i++) {
    const date = addDays(start, i);
    const t = i / totalDays;
    // Poids : 93 → ~92.3 avec bruit ±0.6 ; légère remontée en fin (muscle)
    const weight = 93 - 0.9 * t + 0.25 * Math.sin(t * 9) + (rnd() - 0.5) * 1.1;
    const m: Measurement = { date, weightKg: round(weight, 1), protocolOk: true };
    // Tour de taille hebdo (dimanche) : 97 → 92.5
    if (dayOfWeek(date) === 0 || i === 0) {
      m.waistCm = round(97 - 4.5 * t + (rnd() - 0.5) * 0.4, 1);
      if (i === 0 || i >= totalDays - 1) {
        m.chestCm = round(104 + 1.5 * t, 1);
        m.armCm = round(36.5 + 0.8 * t, 1);
        m.hipsCm = round(101 - 1.2 * t, 1);
        m.thighCm = round(60 + 0.6 * t, 1);
        m.shouldersCm = round(122 + 1.2 * t, 1);
      }
    }
    measurements.push(m);

    // Check-in : énergie monte lentement, sommeil 6.6 → 7.2, stress semaine 5 élevé
    const busyWeek = i >= 28 && i < 35;
    const sleepH = round(6.5 + 0.8 * t + (rnd() - 0.5) * 1.2 - (busyWeek ? 0.7 : 0), 1);
    const ck: DailyCheckin = {
      date,
      energy: clamp15(Math.round(2.8 + 1.2 * t + (rnd() - 0.5) * 1.6 - (busyWeek ? 1 : 0))),
      sleepHours: sleepH,
      sleepQuality: clamp15(Math.round(3 + 0.8 * t + (rnd() - 0.5) * 1.5 - (busyWeek ? 1 : 0))),
      bedTime: busyWeek ? '00:10' : '23:20',
      wakeTime: '06:45',
      stress: clamp15(Math.round(3 + (rnd() - 0.5) * 1.5 + (busyWeek ? 1.2 : 0))),
      soreness: clamp15(Math.round(2.6 + (rnd() - 0.5) * 1.6)),
      motivation: clamp15(Math.round(3.4 + 0.6 * t + (rnd() - 0.5) * 1.4)),
      hunger: clamp15(Math.round(3.1 - 0.3 * t + (rnd() - 0.5) * 1.6)),
      mood: clamp15(Math.round(3.3 + 0.6 * t + (rnd() - 0.5) * 1.3 - (busyWeek ? 0.8 : 0))),
      steps: Math.round(6200 + 1500 * t + (rnd() - 0.5) * 3000),
      pain: null,
    };
    // ne pas inclure le check-in d'aujourd'hui : l'utilisateur le fera dans l'app
    if (i < totalDays && rnd() > 0.08) checkins.push(ck);

    // Séances : jours d'entraînement du programme
    const day = program.days.find((d) => d.weekday === dayOfWeek(date));
    if (day && i < totalDays) {
      const completed = busyWeek ? rnd() > 0.5 : rnd() > 0.12;
      sessions.push({ id: `s_${i}`, date, workoutDayId: day.id, planned: true, completed, durationMin: completed ? Math.round(45 + rnd() * 12) : undefined, readiness: completed ? (rnd() > 0.7 ? 'push' : 'normal') : undefined, perceivedEffort: completed ? Math.round(6 + rnd() * 3) : undefined });
      if (completed) {
        for (const ex of day.exercises) {
          const base = load[ex.exerciseId] ?? 20;
          if (base === 0) continue; // poids du corps / temps : non loggé en charge
          const r = repsState[ex.exerciseId] ?? ex.repMin;
          const sets = Array.from({ length: ex.sets }, (_, k) => ({ weightKg: base, reps: Math.max(ex.repMin - 1, r - (k === ex.sets - 1 ? 1 : 0)), rir: k === ex.sets - 1 ? 1 : 2 }));
          performance.push({ date, exerciseId: ex.exerciseId, sets });
          // progression : +1 rep par séance ; au max → +charge
          if (r >= ex.repMax) {
            load[ex.exerciseId] = round(base * (ex.exerciseId.includes('squat') || ex.exerciseId.includes('deadlift') || ex.exerciseId.includes('leg') || ex.exerciseId.includes('hip') ? 1.05 : 1.025), 1);
            repsState[ex.exerciseId] = ex.repMin;
          } else {
            repsState[ex.exerciseId] = r + (rnd() > 0.35 ? 1 : 0);
          }
        }
      }
    }
  }

  // Repas : mode précis, protéines autour de 175–190 g, kcal variables
  const meals = [] as UserState['meals'];
  for (let i = 0; i < totalDays; i += 1) {
    if (rnd() < 0.3) continue;
    const date = addDays(start, i);
    const training = sessions.some((s) => s.date === date && s.completed);
    meals.push({ date, kcal: Math.round((training ? 2850 : 2500) + (rnd() - 0.5) * 350), proteinG: Math.round(178 + (rnd() - 0.5) * 30), carbsG: Math.round((training ? 300 : 230) + (rnd() - 0.5) * 60), fatG: Math.round(85 + (rnd() - 0.5) * 20), fiberG: Math.round(30 + (rnd() - 0.5) * 10), waterMl: Math.round(2800 + (rnd() - 0.5) * 800), proteinServings: 4, vegServings: 3, carbServings: training ? 4 : 3, fatServings: 3, flexMeal: dayOfWeek(date) === 6 && rnd() > 0.5 });
  }

  const decisions: UserState['decisions'] = [
    { date: addDays(start, 0), summary: 'Stratégie initiale : recomposition. Maintenance les jours d’entraînement, −12 % les jours de repos, 2 g/kg de protéines.', why: 'Objectif : rester à ~93 kg en remplaçant du gras abdominal par du muscle. Un déficit léger protège la force et l’énergie.', evidenceId: 'recomposition_feasibility' },
    { date: addDays(start, 14), summary: 'Aucun changement après 2 semaines.', why: 'Poids stable, tour de taille −1,2 cm, force en hausse : la stratégie fonctionne.', evidenceId: 'weight_noise' },
    { date: addDays(start, 35), summary: 'Semaine chargée : passage en mode Busy, 2 séances de 30 min, repas simplifiés.', why: 'Sommeil et énergie en baisse ; mieux vaut maintenir que forcer.', evidenceId: 'readiness_autoregulation' },
    { date: addDays(start, 42), summary: 'Retour au plan normal. Objectif pas : 7 500/jour.', why: 'Énergie revenue ; les pas sont le levier le moins coûteux pour la dépense.', evidenceId: 'steps_neat' },
  ];

  return {
    profile,
    measurements,
    checkins,
    sessions,
    performance,
    meals,
    lifeEvents: [],
    photos: [
      { id: 'ph1', date: start, view: 'front', uri: '', selfAssessment: undefined },
      { id: 'ph2', date: addDays(start, 28), view: 'front', uri: '', selfAssessment: 'better' },
    ],
    decisions,
  };
}

function clamp15(x: number): number {
  return Math.max(1, Math.min(5, x));
}
