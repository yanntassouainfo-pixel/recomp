import type { DailyCheckin, ISODate, UserState } from './types';
import { addDays, dayOfWeek, inWindow, mean } from './stats';
import { computeBodyCompositionScore, computeRecoveryScore, computeVitalityScore, strengthSeries, waistSeries, weightRolling, weightSeries } from './scores';
import { computeNutritionTargets, type NutritionTargets } from './nutrition/targets';
import { buildDayPlan, type DayPlan } from './nutrition/plan';
import { assessFasting, type FastingAssessment } from './nutrition/fasting';
import { generateProgram, type Program, type WorkoutDay } from './training/program';
import { assessDeload, nextTarget, type NextTarget } from './training/progression';
import { adjustSession, type AdjustedSession } from './training/readiness';
import { weeklyReview, type WeeklyReview } from './adaptation/review';
import { detectPlateau, type PlateauResult } from './adaptation/plateau';
import { activeLifeEvent, recomposeForEvent, type LifePlan } from './adaptation/lifeMode';
import { computeAlerts, type Alert } from './adaptation/alerts';
import { selectWeeklyHabits, type Habit } from './adaptation/habits';
import type { BodyCompositionScore, RecoveryScore, VitalityScore } from './types';
import { buildProgramPlan, phaseFor, weekFor, type PlanPhase, type ProgramPlan, type WeekPlan } from './plan/periodization';
import { summarizeWeek, type WeekSummary } from './plan/calendar';
import { assessWeightGoal, type WeightGoalAssessment } from './plan/weightGoal';
import { currentWeight } from './nutrition/targets';

export interface DailyBrief {
  date: ISODate;
  dayType: 'training' | 'rest';
  greeting: string;
  lines: { label: string; value: string }[];
  topThree: string[];
  /** quelles cartes mettre en avant (UI générative) */
  emphasis: ('workout' | 'nutrition' | 'recovery' | 'sleep' | 'movement' | 'body')[];
}

export interface ComputedState {
  today: ISODate;
  checkin: DailyCheckin | null;
  bcs: BodyCompositionScore;
  vitality: VitalityScore;
  recovery: RecoveryScore;
  program: Program;
  plan: ProgramPlan;
  currentWeek: WeekPlan | null;
  currentPhase: PlanPhase | null;
  weekSummary: WeekSummary | null;
  weightGoal: WeightGoalAssessment | null;
  todayWorkout: WorkoutDay | null;
  session: AdjustedSession | null;
  targetsByExercise: Record<string, NextTarget>;
  deload: { recommended: boolean; reasons: string[] };
  nutrition: NutritionTargets;
  dayPlan: DayPlan;
  fasting: FastingAssessment;
  review: WeeklyReview;
  plateau: PlateauResult;
  lifePlan: LifePlan | null;
  alerts: Alert[];
  habits: Habit[];
  brief: DailyBrief;
  series: {
    weight: { date: ISODate; value: number }[];
    weightRolling: { date: ISODate; value: number }[];
    waist: { date: ISODate; value: number }[];
    strength: { date: ISODate; value: number }[];
  };
}

/** Index de rotation des idées de repas : jours écoulés depuis 1970 (monotone, un nouveau menu chaque jour). */
export function daySeed(iso: ISODate): number {
  return Math.floor(Date.parse(iso + 'T00:00:00Z') / 86_400_000);
}

export function isTrainingDay(state: UserState, program: Program, today: ISODate, plan?: ProgramPlan): WorkoutDay | null {
  const planned = state.sessions.find((s) => s.date === today);
  if (planned) return program.days.find((d) => d.id === planned.workoutDayId) ?? program.days[0] ?? null;
  if (plan) {
    const w = weekFor(plan, today);
    const s = w?.sessions.find((x) => x.date === today);
    if (w && !s) return null;
    if (s) return program.days.find((d) => d.id === s.workoutDayId) ?? null;
  }
  const dow = dayOfWeek(today);
  return program.days.find((d) => d.weekday === dow) ?? null;
}

export function computeState(state: UserState, today: ISODate): ComputedState {
  const checkin = state.checkins.find((c) => c.date === today) ?? null;
  const program = generateProgram(state.profile);
  const plan = buildProgramPlan(state.profile, program);
  const currentWeek = weekFor(plan, today);
  const currentPhase = phaseFor(plan, today);
  const weekSummary = summarizeWeek(state, plan, today);
  const weightGoal = assessWeightGoal(state.profile, currentWeight(state, today), today);
  const todayWorkout = isTrainingDay(state, program, today, plan);
  const lifeEvent = activeLifeEvent(state, today);
  const lifePlan = lifeEvent ? recomposeForEvent(state, lifeEvent) : null;

  const bcs = computeBodyCompositionScore(state, today);
  const vitality = computeVitalityScore(state, today);
  const recovery = computeRecoveryScore(state, today, checkin);
  const review = weeklyReview(state, today);
  const plateau = detectPlateau(state, today);
  const deloadA = assessDeload(state, today, recovery.score);

  const dayType: 'training' | 'rest' = todayWorkout && recovery.readiness !== 'rest' && lifeEvent?.type !== 'illness' ? 'training' : 'rest';
  const recent = inWindow(state.checkins, addDays(today, -2), today);
  const nutrition = computeNutritionTargets(state, today, dayType, {
    highHunger: checkin ? checkin.hunger >= 4 : recent.length ? mean(recent.map((c) => c.hunger)) >= 3.8 : false,
    lowEnergy: checkin ? checkin.energy <= 2 : false,
    poorSleep: checkin ? checkin.sleepHours < 6 : false,
    lifeEvent: lifeEvent?.type ?? null,
    reviewAdjustment: review.energyAdjustment || undefined,
    maintenance: currentPhase?.nutritionMode === 'maintenance' ? currentPhase.name : undefined,
  });
  const dayPlan = buildDayPlan(nutrition, state.profile, daySeed(today));
  const fasting = assessFasting(state, today, nutrition.proteinG);

  const phasedWorkout: WorkoutDay | null = todayWorkout && currentPhase
    ? { ...todayWorkout, exercises: todayWorkout.exercises.map((e) => ({ ...e, sets: Math.max(2, Math.round(e.sets * currentPhase.volumeMultiplier)), rirTarget: currentPhase.rirTarget, note: currentPhase.intent === 'deload' ? 'Semaine allégée' : e.note })) }
    : todayWorkout;
  const session = phasedWorkout ? adjustSession(phasedWorkout, recovery.readiness, checkin) : null;
  const targetsByExercise: Record<string, NextTarget> = {};
  if (phasedWorkout) {
    for (const ex of phasedWorkout.exercises) targetsByExercise[ex.exerciseId] = nextTarget(ex, state.performance, deloadA.recommended || currentPhase?.intent === 'deload');
  }
  const alerts = computeAlerts(state, today);
  const habits = selectWeeklyHabits(state, today);

  const brief = buildBrief({ state, today, dayType, session, nutrition, recovery, vitality, habits, lifePlan, checkin, phase: currentPhase, week: currentWeek, weeksTotal: plan.weeksTotal });

  return {
    today,
    checkin,
    bcs,
    vitality,
    recovery,
    program,
    plan,
    currentWeek,
    currentPhase,
    weekSummary,
    weightGoal,
    todayWorkout: phasedWorkout,
    session,
    targetsByExercise,
    deload: { recommended: deloadA.recommended, reasons: deloadA.reasons },
    nutrition,
    dayPlan,
    fasting,
    review,
    plateau,
    lifePlan,
    alerts,
    habits,
    brief,
    series: {
      weight: weightSeries(state),
      weightRolling: weightRolling(state),
      waist: waistSeries(state),
      strength: strengthSeries(state),
    },
  };
}

function buildBrief(a: {
  state: UserState;
  today: ISODate;
  dayType: 'training' | 'rest';
  session: AdjustedSession | null;
  nutrition: NutritionTargets;
  recovery: RecoveryScore;
  vitality: VitalityScore;
  habits: Habit[];
  lifePlan: LifePlan | null;
  checkin: DailyCheckin | null;
  phase: PlanPhase | null;
  week: WeekPlan | null;
  weeksTotal: number;
}): DailyBrief {
  const { state, today, dayType, session, nutrition, recovery, vitality, habits, lifePlan } = a;
  const p = state.profile;
  const lines: DailyBrief['lines'] = [];
  const simple = p.nutritionPrecision === 'simple';

  if (a.phase && a.week) lines.push({ label: 'Programme', value: `Semaine ${a.week.weekNumber}/${a.weeksTotal} · ${a.phase.name}` });
  if (lifePlan) lines.push({ label: 'Mode vie', value: lifePlan.title });
  if (session && !session.replacedByRecovery) lines.push({ label: 'Musculation', value: `${session.title} — ${session.estimatedMinutes} min` });
  else if (session?.replacedByRecovery) lines.push({ label: 'Récupération', value: session.title });
  else lines.push({ label: 'Repos', value: 'Marche + mobilité 15 min' });

  lines.push({
    label: 'Nutrition',
    value: simple
      ? `${nutrition.simple.proteinPalms} paumes de protéines · ${nutrition.simple.vegFists} poings de légumes · ${nutrition.simple.carbFists} poings de glucides`
      : `${nutrition.proteinG} g protéines · ${nutrition.kcal} kcal (${nutrition.strategy.toLowerCase()})`,
  });
  const stepsAvg = inWindow(state.checkins, addDays(today, -13), today).map((c) => c.steps).filter((s): s is number => typeof s === 'number');
  const stepTarget = stepsAvg.length ? Math.round((mean(stepsAvg) + 1000) / 500) * 500 : p.stepsPerDay ? Math.round((p.stepsPerDay + 1000) / 500) * 500 : 7500;
  lines.push({ label: 'Mouvement', value: `${stepTarget.toLocaleString('fr-FR')} pas` });
  lines.push({ label: 'Hydratation', value: `${(nutrition.waterMl / 1000).toFixed(1)} L` });
  lines.push({ label: 'Sommeil', value: 'Coucher avant 23 h 30 · objectif 7 h 30' });
  lines.push({ label: 'Vitalité', value: `${vitality.score}/10` });

  const topThree: string[] = [];
  if (session && !session.replacedByRecovery) topThree.push(`Faire ta séance ${session.title.replace(/ — .*$/, '')}${recovery.readiness === 'light' ? ' en version allégée' : ''}.`);
  else if (recovery.readiness === 'rest') topThree.push('Récupérer vraiment : marche, mobilité, coucher tôt.');
  topThree.push(simple ? 'Une paume de protéines à chaque repas.' : `Atteindre ${nutrition.proteinG} g de protéines, répartis sur ${p.mealsPerDay} repas.`);
  const h = habits.find((x) => x.id === 'bedtime' || x.id === 'steps');
  topThree.push(h ? h.text + '.' : 'Boire ' + (nutrition.waterMl / 1000).toFixed(1) + ' L et marcher.');

  const emphasis: DailyBrief['emphasis'] =
    recovery.readiness === 'rest' || recovery.readiness === 'light'
      ? ['recovery', 'sleep', 'movement']
      : dayType === 'training'
        ? ['workout', 'nutrition', 'recovery']
        : ['recovery', 'movement', 'nutrition'];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';
  return { date: today, dayType, greeting: `${greeting}${p.displayName ? ' ' + p.displayName : ''}.`, lines, topThree: topThree.slice(0, 3), emphasis };
}
