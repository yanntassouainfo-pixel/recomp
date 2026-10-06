import { describe, expect, it } from 'vitest';
import {
  buildDemoState,
  computeState,
  computeBodyCompositionScore,
  computeNutritionTargets,
  buildDayPlan,
  generateProgram,
  nextTarget,
  detectPlateau,
  weeklyReview,
  assessFasting,
  rulesCoach,
  recomposeForEvent,
  adaptHabitualDish,
  e1rm,
  linearTrend,
  rollingMean,
  EVIDENCE,
  buildProgramPlan,
  addDays,
  chooseSplitStyle,
  analyzeProgram,
  EXERCISES,
  FOOD_BY_ID,
  swapMealItem,
  fitMealTo,
  sameBenefits,
  assessWeightGoal,
  buildCalendar,
  phasesFor,
  summarizeWeek,
  type UserState,
} from '../src/index';

const TODAY = '2026-10-05';

describe('stats', () => {
  it('e1rm Epley', () => {
    expect(e1rm(100, 1)).toBe(100);
    expect(Math.round(e1rm(100, 10))).toBe(133);
  });
  it('rolling mean & trend', () => {
    const s = Array.from({ length: 14 }, (_, i) => ({ date: `2026-09-${String(i + 1).padStart(2, '0')}`, value: 93 - i * 0.05 }));
    const r = rollingMean(s, 7);
    expect(r.length).toBe(14);
    const t = linearTrend(s, 0.01);
    expect(t?.direction).toBe('down');
    expect(t?.slopePerWeek).toBeCloseTo(-0.35, 1);
  });
});

describe('demo state — cas fondateur 1,92 m / 93 kg', () => {
  const state = buildDemoState(TODAY);
  const c = computeState(state, TODAY);

  it('a 8 semaines de données', () => {
    expect(state.measurements.length).toBeGreaterThan(50);
    expect(state.checkins.length).toBeGreaterThan(40);
    expect(state.performance.length).toBeGreaterThan(40);
  });
  it('reconnaît une recomposition : poids ~stable, taille en baisse, score > 60', () => {
    const w = c.series.weightRolling;
    const delta = w[w.length - 1]!.value - w[0]!.value;
    expect(Math.abs(delta)).toBeLessThan(2);
    const waist = c.series.waist;
    expect(waist[waist.length - 1]!.value).toBeLessThan(waist[0]!.value - 2);
    expect(c.bcs.score).toBeGreaterThan(60);
    expect(c.bcs.trend).toBe('improving');
    expect(c.bcs.headline.toLowerCase()).toContain('tour de taille');
  });
  it('la revue hebdo dit de ne rien changer quand ça marche', () => {
    expect(c.review.keep.length).toBeGreaterThan(0);
    expect(c.review.energyAdjustment).toBe(0);
  });
  it('le plateau detector ne panique pas', () => {
    expect(['progressing', 'pseudo_plateau', 'insufficient_data']).toContain(c.plateau.kind);
    expect(c.plateau.kind).not.toBe('true_plateau');
  });
  it('produit un brief avec 3 priorités et une emphase', () => {
    expect(c.brief.topThree.length).toBe(3);
    expect(c.brief.emphasis.length).toBe(3);
  });
  it('les habitudes sont 1 à 3', () => {
    expect(c.habits.length).toBeGreaterThanOrEqual(1);
    expect(c.habits.length).toBeLessThanOrEqual(3);
  });
});

describe('nutrition engine', () => {
  const state = buildDemoState(TODAY);
  it('cycle les apports entre entraînement et repos, protéines 2 g/kg en déficit', () => {
    const tr = computeNutritionTargets(state, TODAY, 'training');
    const rest = computeNutritionTargets(state, TODAY, 'rest');
    expect(tr.kcal).toBeGreaterThan(rest.kcal);
    expect(tr.energyDeltaPct).toBe(0);
    expect(rest.energyDeltaPct).toBeLessThan(0);
    expect(rest.proteinPerKg).toBeGreaterThanOrEqual(2.0);
    expect(rest.proteinG).toBeGreaterThan(170);
    expect(tr.carbsG).toBeGreaterThan(rest.carbsG);
  });
  it('réduit le déficit si sommeil dégradé', () => {
    const a = computeNutritionTargets(state, TODAY, 'rest');
    const b = computeNutritionTargets(state, TODAY, 'rest', { poorSleep: true });
    expect(b.kcal).toBeGreaterThan(a.kcal);
    expect(b.notes.join(' ')).toMatch(/sommeil/i);
  });
  it('safe mode : aucun déficit pour profil à risque', () => {
    const risky: UserState = { ...state, profile: { ...state.profile, risk: { eatingDisorderHistory: true } } };
    const t = computeNutritionTargets(risky, TODAY, 'rest');
    expect(t.safeMode).toBe(true);
    expect(t.energyDeltaPct).toBe(0);
  });
  it('plan du jour : totaux proches des cibles, aliments ouest-africains présents', () => {
    const t = computeNutritionTargets(state, TODAY, 'training');
    const plan = buildDayPlan(t, state.profile, 3);
    expect(plan.meals.length).toBe(4);
    expect(plan.totals.p).toBeGreaterThan(t.proteinG * 0.85);
    expect(plan.totals.p).toBeLessThan(t.proteinG * 1.25);
    expect(plan.totals.kcal).toBeGreaterThan(t.kcal * 0.8);
    expect(plan.totals.kcal).toBeLessThan(t.kcal * 1.25);
    const ids = plan.meals.flatMap((m) => m.items.map((i) => i.foodId));
    const westAfrican = ['attieke', 'yam_boiled', 'cassava_boiled', 'foutou', 'plantain_boiled', 'maize_porridge', 'millet_couscous', 'smoked_fish', 'tilapia', 'mackerel', 'okra', 'leafy_greens', 'peanuts', 'palm_oil', 'papaya', 'mango', 'yassa', 'ndole', 'egusi', 'okra_soup', 'fonio', 'gari', 'sorghum_porridge', 'black_eyed_peas', 'cassava_leaves', 'goat', 'guava', 'sauce_feuille', 'sauce_arachide', 'thieboudienne', 'sauce_graine', 'sauce_tomate_poisson'];
    expect(ids.some((id) => westAfrican.includes(id))).toBe(true);
    for (const m of plan.meals) expect(m.items.some((i) => i.role === 'protein' || i.role === 'dish')).toBe(true);
  });
  it('adapte un plat habituel', () => {
    const t = computeNutritionTargets(state, TODAY, 'rest');
    const r = adaptHabitualDish('sauce_arachide', 'rice_white', t);
    expect(r).not.toBeNull();
    expect(r!.lines.length).toBeGreaterThanOrEqual(3);
  });
  it('jeûne : jamais recommandé en profil à risque', () => {
    const risky: UserState = { ...state, profile: { ...state.profile, risk: { pregnant: true } } };
    expect(assessFasting(risky, TODAY).verdict).toBe('not_recommended');
  });
});

describe('training engine', () => {
  const state = buildDemoState(TODAY);
  it('génère un programme 3 jours full body, ~50 min, avec biais épaules', () => {
    const prog = generateProgram(state.profile);
    expect(prog.days.length).toBe(3);
    for (const d of prog.days) {
      expect(d.exercises.length).toBeGreaterThanOrEqual(4);
      expect(d.exercises.length).toBeLessThanOrEqual(5);
    }
    expect(prog.honestNotes.join(' ')).toMatch(/ventre/i);
  });
  it('exclut les exercices sollicitant une limitation', () => {
    const prog = generateProgram({ ...state.profile, limitations: [{ region: 'shoulder' }], sessionsPerWeek: 4, mode: 'performance', sessionMinutes: 60 });
    const ids = prog.days.flatMap((d) => d.exercises.map((e) => e.exerciseId));
    expect(ids).not.toContain('overhead_press');
    expect(ids).not.toContain('bench_press');
    expect(ids).not.toContain('lateral_raise');
  });
  it('maison sans matériel : programme faisable', () => {
    const prog = generateProgram({ ...state.profile, equipment: 'home_none', sessionsPerWeek: 2 });
    expect(prog.days.length).toBe(2);
    expect(prog.days.every((d) => d.exercises.length >= 3)).toBe(true);
  });
  it('double progression', () => {
    const planned = { exerciseId: 'bench_press', name: 'DC', sets: 3, repMin: 5, repMax: 8, restSec: 120, rirTarget: 2 };
    const top = nextTarget(planned, [{ date: '2026-10-01', exerciseId: 'bench_press', sets: [{ weightKg: 80, reps: 8, rir: 2 }, { weightKg: 80, reps: 8, rir: 2 }, { weightKg: 80, reps: 8, rir: 2 }] }]);
    expect(top.action).toBe('increase_load');
    expect(top.weightKg).toBe(82.5);
    const mid = nextTarget(planned, [{ date: '2026-10-01', exerciseId: 'bench_press', sets: [{ weightKg: 80, reps: 7, rir: 2 }, { weightKg: 80, reps: 6, rir: 1 }, { weightKg: 80, reps: 6, rir: 1 }] }]);
    expect(mid.action).toBe('add_reps');
    const low = nextTarget(planned, [{ date: '2026-10-01', exerciseId: 'bench_press', sets: [{ weightKg: 80, reps: 4, rir: 0 }] }]);
    expect(low.action).toBe('decrease_load');
    expect(nextTarget(planned, []).action).toBe('start');
  });
  it('readiness : douleur inhabituelle → pas de séance', () => {
    const s: UserState = { ...state, checkins: [...state.checkins, { date: TODAY, energy: 4, sleepHours: 7.5, sleepQuality: 4, stress: 2, soreness: 2, motivation: 4, hunger: 3, mood: 4, pain: { region: 'shoulder', severity: 4, unusual: true } }] };
    const c = computeState(s, TODAY);
    expect(c.recovery.readiness).toBe('rest');
    if (c.session) expect(c.session.replacedByRecovery).toBe(true);
  });
});

describe('adaptation', () => {
  it('perte rapide → sécurité et remontée des apports', () => {
    const base = buildDemoState(TODAY);
    // Forcer une chute de poids de 1,5 %/semaine sur 4 semaines
    const measurements = base.measurements.map((m) => {
      const days = (Date.parse(TODAY) - Date.parse(m.date)) / 86_400_000;
      return days <= 28 ? { ...m, weightKg: 93 - (28 - days) * 0.2 } : m;
    });
    const s: UserState = { ...base, measurements };
    const r = weeklyReview(s, TODAY);
    expect(r.blocks.some((b) => /rapide/i.test(b.text))).toBe(true);
    expect(r.energyAdjustment).toBeGreaterThan(0);
  });
  it('vrai plateau détecté quand tout est plat avec bonne adhérence', () => {
    const base = buildDemoState(TODAY);
    const flatMeasurements = base.measurements.map((m) => ({ ...m, weightKg: 92.5, waistCm: m.waistCm !== undefined ? 94 : undefined }));
    const flatPerf = base.performance.map((p) => ({ ...p, sets: p.sets.map((s) => ({ ...s, weightKg: 60, reps: 8, rir: 2 })) }));
    const sessions = base.sessions.map((s) => ({ ...s, completed: true }));
    const s: UserState = { ...base, measurements: flatMeasurements, performance: flatPerf, sessions };
    const pl = detectPlateau(s, TODAY);
    expect(pl.kind).toBe('true_plateau');
    const r = weeklyReview(s, TODAY);
    expect(r.energyAdjustment).toBeLessThan(0);
    expect(r.change.length).toBe(1);
  });
  it('life mode : ramadan / voyage / restaurant', () => {
    const s = buildDemoState(TODAY);
    const r = recomposeForEvent(s, { id: 'e', type: 'ramadan', startDate: TODAY, endDate: '2026-11-03' });
    expect(r.nutrition.join(' ')).toMatch(/iftar/i);
    const t = recomposeForEvent(s, { id: 'e', type: 'travel', startDate: TODAY, endDate: '2026-10-09' });
    expect(t.title).toContain('5');
    const rest = recomposeForEvent(s, { id: 'e', type: 'restaurant', startDate: TODAY, endDate: TODAY });
    expect(rest.message.toLowerCase()).toContain('aucune compensation');
  });
});

describe('coach à règles', () => {
  const state = buildDemoState(TODAY);
  const c = computeState(state, TODAY);
  const ask = (q: string) => rulesCoach(q, state, c);
  it('répond aux questions types avec le contexte', () => {
    expect(ask('Je mange quoi ce soir ?').intent).toBe('what_to_eat');
    expect(ask("J'ai raté ma séance, je fais quoi ?").intent).toBe('missed_session');
    expect(ask('Je suis invité au restaurant').intent).toBe('restaurant');
    expect(ask("J'ai très faim aujourd'hui").intent).toBe('hunger');
    expect(ask('Je pars en voyage pendant 5 jours').text).toContain('5 jours');
    expect(ask("Je n'ai pas de poulet").intent).toBe('substitute');
    expect(ask('Je peux manger du riz ?').text.toLowerCase()).toContain('oui');
    expect(ask("Je suis fatigué, je m'entraîne quand même ?").intent).toBe('tired');
    expect(ask('Mon poids ne bouge plus depuis 3 semaines').intent).toBe('plateau');
    expect(ask('Pourquoi plus de glucides aujourd’hui ?').intent).toBe('why_carbs');
  });
  it('plateau : explique la recomposition et dit de ne rien changer', () => {
    const r = ask('Mon poids ne bouge plus depuis 3 semaines');
    expect(r.text.toLowerCase()).toMatch(/tour de taille/);
  });
  it('refuse le % de masse grasse sur photo', () => {
    expect(ask('Tu peux estimer mon pourcentage de gras sur ma photo ?').text).toMatch(/pas de pourcentage/i);
  });
  it('douleur → orientation professionnelle', () => {
    expect(ask("J'ai une douleur à l'épaule").text).toMatch(/professionnel/i);
  });
});

describe('evidence layer', () => {
  it('toutes les fiches ont un niveau et une source', () => {
    for (const e of Object.values(EVIDENCE)) {
      expect(['solid', 'probable', 'uncertain', 'approach']).toContain(e.level);
      expect(e.sources.length).toBeGreaterThan(0);
    }
  });
});

describe('programme périodisé & calendrier', () => {
  const state = buildDemoState(TODAY);
  const c = computeState(state, TODAY);
  it('12 semaines, phases cohérentes avec l’objectif', () => {
    expect(c.plan.weeksTotal).toBe(12);
    expect(c.plan.weeks.length).toBe(12);
    expect(c.plan.phases.map((p) => p.intent)).toEqual(['foundation', 'build', 'deload', 'intensify', 'consolidate']);
    const fat = phasesFor({ ...state.profile, primaryGoal: 'fat_loss' });
    expect(fat.some((p) => p.intent === 'diet_break')).toBe(true);
    expect(fat.reduce((a, p) => a + p.weeks, 0)).toBe(12);
    for (const g of ['muscle_gain', 'strength', 'energy', 'sleep', 'health'] as const) {
      expect(phasesFor({ ...state.profile, primaryGoal: g }).reduce((a, p) => a + p.weeks, 0)).toBe(12);
    }
  });
  it('la démo (8 semaines écoulées) est en semaine 9, phase intensification', () => {
    expect(c.currentWeek?.weekNumber).toBe(9);
    expect(c.currentPhase?.intent).toBe('intensify');
    expect(c.brief.lines[0]?.label).toBe('Programme');
  });
  it('la phase module volume et RIR de la séance', () => {
    expect(c.todayWorkout).not.toBeNull();
    for (const e of c.todayWorkout!.exercises) expect(e.rirTarget).toBe(1);
  });
  it('deload → nutrition à maintenance', () => {
    const plan = buildProgramPlan(state.profile, c.program);
    const deloadWeek = plan.weeks.find((w) => w.isDeload)!;
    const day = deloadWeek.sessions[0]!.date;
    const s: UserState = { ...state, profile: { ...state.profile, createdAt: state.profile.createdAt } };
    const cd = computeState(s, day);
    expect(cd.currentPhase?.intent).toBe('deload');
    expect(cd.nutrition.energyDeltaPct).toBe(0);
    expect(cd.nutrition.strategy).toMatch(/maintenance/i);
  });
  it('calendrier : séances faites / manquées / prévues, mesures et photos', () => {
    const ev = buildCalendar(state, c.plan, c.plan.startDate, c.plan.endDate, TODAY);
    const sessions = ev.filter((e) => e.kind === 'session');
    expect(sessions.length).toBe(36);
    expect(sessions.some((e) => e.status === 'done')).toBe(true);
    expect(sessions.some((e) => e.status === 'planned')).toBe(true);
    expect(ev.some((e) => e.kind === 'photos')).toBe(true);
    expect(ev.filter((e) => e.kind === 'measure').length).toBe(12);
    const ws = summarizeWeek(state, c.plan, TODAY);
    expect(ws?.weekNumber).toBe(9);
  });
});

describe('plausibilité & dates', () => {
  it('aucun aliment hors des bornes d’une assiette, sur plusieurs profils', () => {
    const base = buildDemoState(TODAY);
    const profiles = [base.profile, { ...base.profile, sex: 'female' as const, startWeightKg: 62, heightCm: 165, primaryGoal: 'fat_loss' as const, foodCultures: ['europe' as const] }, { ...base.profile, primaryGoal: 'muscle_gain' as const, startWeightKg: 70, dietaryPreferences: ['vegetarian'] }, { ...base.profile, foodCultures: ['maghreb' as const], dietaryPreferences: ['halal'] }];
    for (const pr of profiles) for (const dt of ['training', 'rest'] as const) for (const seed of [0, 1, 2, 3, 4, 5, 6]) {
      const st: UserState = { ...base, profile: pr, measurements: [{ date: TODAY, weightKg: pr.startWeightKg }] };
      const t = computeNutritionTargets(st, TODAY, dt);
      const plan = buildDayPlan(t, pr, seed);
      for (const m of plan.meals) for (const it of m.items) {
        expect(it.grams, `${pr.primaryGoal}/${dt}/${seed} ${it.foodId}`).toBeLessThanOrEqual(it.role === 'veg' ? 400 : it.role === 'dish' ? 500 : 350);
        if (it.foodId === 'eggs') expect(it.grams).toBeLessThanOrEqual(220);
      }
      expect(plan.totals.p).toBeGreaterThan(t.proteinG * 0.8);
    }
  });
  it('addDays est stable quel que soit le fuseau (pas de toISOString)', () => {
    expect(addDays('2026-10-05', 1)).toBe('2026-10-06');
    expect(addDays('2026-10-05', 0)).toBe('2026-10-05');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
  });
});

describe('adaptation du programme & objectif de poids', () => {
  const base = buildDemoState(TODAY).profile;
  it('le split dépend du niveau, de l’objectif et de la préférence', () => {
    expect(chooseSplitStyle({ ...base, level: 'beginner', sessionsPerWeek: 3 }).style).toBe('full_body');
    expect(chooseSplitStyle({ ...base, level: 'intermediate', sessionsPerWeek: 3, primaryGoal: 'muscle_gain' }).style).toBe('upper_lower');
    expect(chooseSplitStyle({ ...base, level: 'advanced', sessionsPerWeek: 3, primaryGoal: 'muscle_gain' }).style).toBe('ppl');
    expect(chooseSplitStyle({ ...base, level: 'intermediate', sessionsPerWeek: 5 }).style).toBe('ppl');
    expect(chooseSplitStyle({ ...base, level: 'intermediate', sessionsPerWeek: 3, primaryGoal: 'energy' }).style).toBe('full_body');
    expect(chooseSplitStyle({ ...base, level: 'beginner', sessionsPerWeek: 3, splitPreference: 'ppl' }).style).toBe('ppl');
    const prog = generateProgram({ ...base, level: 'intermediate', sessionsPerWeek: 3, primaryGoal: 'muscle_gain' });
    expect(prog.days.map((d) => d.name)).toEqual(['Haut du corps', 'Bas du corps', 'Corps entier']);
    expect(prog.availableStyles).toContain('ppl');
  });
  it('objectif de poids : durée réaliste, refus sous IMC 18,5', () => {
    const g = assessWeightGoal({ ...base, targetWeightKg: 85 }, 93, TODAY)!;
    expect(g.direction).toBe('lose');
    expect(g.weeks).toBeGreaterThan(12);
    expect(g.weeks).toBeLessThan(30);
    expect(g.safe).toBe(true);
    const bad = assessWeightGoal({ ...base, targetWeightKg: 60 }, 93, TODAY)!;
    expect(bad.safe).toBe(false);
    const st: UserState = { ...buildDemoState(TODAY), profile: { ...base, targetWeightKg: 60, primaryGoal: 'fat_loss' } };
    expect(computeNutritionTargets(st, TODAY, 'rest').energyDeltaPct).toBe(0);
    expect(assessWeightGoal({ ...base, targetWeightKg: null }, 93, TODAY)).toBeNull();
  });
});

describe('bibliothèque & analyseur de programme', () => {
  const profile = buildDemoState(TODAY).profile;
  it('chaque exercice a des étapes et des erreurs fréquentes', () => {
    for (const ex of EXERCISES) {
      expect(ex.steps?.length, ex.id).toBeGreaterThanOrEqual(2);
      expect(ex.mistakes?.length, ex.id).toBeGreaterThanOrEqual(1);
    }
  });
  it('un programme « bro split » haut du corps seul est mal noté, un full body équilibré bien noté', () => {
    const bro = analyzeProgram({ name: 'Bro', days: [
      { name: 'Pecs', weekday: 1, exercises: [{ exerciseId: 'bench_press', sets: 5, repMin: 6, repMax: 10 }, { exerciseId: 'db_bench', sets: 4, repMin: 8, repMax: 12 }, { exerciseId: 'chest_press_machine', sets: 4, repMin: 10, repMax: 15 }] },
      { name: 'Bras', weekday: 3, exercises: [{ exerciseId: 'biceps_curl', sets: 6, repMin: 8, repMax: 12 }, { exerciseId: 'triceps_extension', sets: 6, repMin: 10, repMax: 15 }] },
      { name: 'Épaules', weekday: 5, exercises: [{ exerciseId: 'overhead_press', sets: 5, repMin: 6, repMax: 10 }, { exerciseId: 'lateral_raise', sets: 5, repMin: 12, repMax: 20 }] },
    ] }, profile);
    expect(bro.score).toBeLessThan(50);
    expect(bro.issues.some((i) => /Bas du corps/.test(i.text))).toBe(true);
    expect(bro.issues.some((i) => /poussée/i.test(i.text) && /tirage/i.test(i.text))).toBe(true);
    const good = analyzeProgram({ name: 'FB', days: [
      { name: 'A', weekday: 1, exercises: [{ exerciseId: 'squat', sets: 4, repMin: 6, repMax: 10 }, { exerciseId: 'bench_press', sets: 4, repMin: 6, repMax: 10 }, { exerciseId: 'row_barbell', sets: 4, repMin: 8, repMax: 12 }, { exerciseId: 'plank', sets: 3, repMin: 30, repMax: 60 }] },
      { name: 'B', weekday: 3, exercises: [{ exerciseId: 'romanian_deadlift', sets: 4, repMin: 8, repMax: 12 }, { exerciseId: 'overhead_press', sets: 4, repMin: 6, repMax: 10 }, { exerciseId: 'lat_pulldown', sets: 4, repMin: 8, repMax: 12 }, { exerciseId: 'lateral_raise', sets: 3, repMin: 12, repMax: 20 }] },
      { name: 'C', weekday: 5, exercises: [{ exerciseId: 'split_squat', sets: 3, repMin: 8, repMax: 12 }, { exerciseId: 'db_bench', sets: 3, repMin: 8, repMax: 12 }, { exerciseId: 'seated_row', sets: 3, repMin: 8, repMax: 12 }, { exerciseId: 'leg_curl', sets: 3, repMin: 10, repMax: 15 }] },
    ] }, profile);
    expect(good.score).toBeGreaterThan(bro.score + 25);
    expect(good.score).toBeGreaterThanOrEqual(70);
  });
  it('un programme importé remplace le programme généré', () => {
    const custom = { name: 'Mon programme', days: [{ name: 'Jour 1', weekday: 2, exercises: [{ exerciseId: 'goblet_squat', sets: 3, repMin: 8, repMax: 12 }, { exerciseId: 'push_up', sets: 3, repMin: 8, repMax: 15 }] }] };
    const prog = generateProgram({ ...profile, customProgram: custom });
    expect(prog.split).toBe('Mon programme');
    expect(prog.days[0]!.exercises.map((e) => e.exerciseId)).toEqual(['goblet_squat', 'push_up']);
    expect(prog.days[0]!.weekday).toBe(2);
  });
});

describe('variété des repas', () => {
  it('7 jours consécutifs : idées et sources de protéines variées, jamais la même idée deux jours de suite', () => {
    const st = buildDemoState(TODAY);
    const t = computeNutritionTargets(st, TODAY, 'training');
    const titles: string[][] = [];
    const dinnerProteins = new Set<string>();
    for (let d = 0; d < 7; d++) {
      const plan = buildDayPlan(t, st.profile, 100 + d);
      titles.push(plan.meals.map((m) => m.title));
      const dinner = plan.meals.find((m) => m.id === 'dinner')!;
      dinnerProteins.add(dinner.items.find((i) => i.role === 'protein' || i.role === 'dish')?.foodId ?? '');
      for (const m of plan.meals) { expect(m.title.length).toBeGreaterThan(3); expect(m.items.some((i) => i.role === 'protein' || i.role === 'dish')).toBe(true); }
      expect(plan.totals.p).toBeGreaterThan(t.proteinG * 0.8);
      expect(plan.totals.kcal).toBeLessThan(t.kcal * 1.3);
    }
    for (let d = 1; d < 7; d++) for (let m = 0; m < 4; m++) expect(titles[d]![m]).not.toBe(titles[d - 1]![m]);
    expect(dinnerProteins.size).toBeGreaterThanOrEqual(4);
    expect(new Set(titles.map((x) => x[1])).size).toBeGreaterThanOrEqual(5); // déjeuners
  });
  it('« une autre idée » change le repas', () => {
    const st = buildDemoState(TODAY);
    const t = computeNutritionTargets(st, TODAY, 'rest');
    const a = buildDayPlan(t, st.profile, 42);
    const b = buildDayPlan(t, st.profile, 42, { dinner: 1 });
    expect(b.meals.find((m) => m.id === 'dinner')!.title).not.toBe(a.meals.find((m) => m.id === 'dinner')!.title);
    expect(b.meals.find((m) => m.id === 'lunch')!.title).toBe(a.meals.find((m) => m.id === 'lunch')!.title);
  });
  it('végétarien ouest-africain : aucun aliment carné, idées disponibles', () => {
    const st = buildDemoState(TODAY);
    const pr = { ...st.profile, dietaryPreferences: ['vegetarian'] };
    const t = computeNutritionTargets({ ...st, profile: pr }, TODAY, 'training');
    for (let d = 0; d < 5; d++) {
      const plan = buildDayPlan(t, pr, 200 + d);
      for (const m of plan.meals) for (const it of m.items) { const f = FOOD_BY_ID[it.foodId]!; expect(f.tags.includes('meat') || f.tags.includes('fish'), it.foodId).toBe(false); }
    }
  });
});

describe('changer un repas, mêmes bénéfices', () => {
  it('remplacer la source de protéines conserve les protéines du repas', () => {
    const st = buildDemoState(TODAY);
    const t = computeNutritionTargets(st, TODAY, 'training');
    const plan = buildDayPlan(t, st.profile, 300);
    const dinner = plan.meals.find((m) => m.id === 'dinner')!;
    const prot = dinner.items.find((i) => i.role === 'protein' && i.alternatives.length > 0) ?? dinner.items.find((i) => i.role === 'protein')!;
    const alt = prot.alternatives[0]?.foodId ?? 'chicken_breast';
    const swapped = swapMealItem(dinner, prot.foodId, alt);
    expect(swapped.items.some((i) => i.foodId === alt)).toBe(true);
    expect(Math.abs(swapped.macros.p - dinner.macros.p)).toBeLessThan(Math.max(8, dinner.macros.p * 0.15));
  });
  it('sameBenefits accepte ±12 % de protéines', () => {
    expect(sameBenefits({ kcal: 800, p: 50, c: 80, f: 20, fiber: 5 }, { kcal: 850, p: 54, c: 70, f: 25, fiber: 4 }).equivalent).toBe(true);
    expect(sameBenefits({ kcal: 800, p: 50, c: 80, f: 20, fiber: 5 }, { kcal: 1100, p: 30, c: 70, f: 25, fiber: 4 }).equivalent).toBe(false);
  });
});

describe('recalage « mêmes bénéfices »', () => {
  it('un repas tiré au hasard recalé reste à ±12 % de protéines et ±15 % d’énergie dans la grande majorité des cas', () => {
    const st = buildDemoState(TODAY);
    const t = computeNutritionTargets(st, TODAY, 'training');
    const base = buildDayPlan(t, st.profile, 500);
    let ok = 0, n = 0;
    for (let v = 1; v <= 12; v++) {
      const alt = buildDayPlan(t, st.profile, 500, { dinner: v, lunch: v });
      for (const id of ['dinner', 'lunch']) {
        const o = base.meals.find((m) => m.id === id)!; const m = fitMealTo(alt.meals.find((x) => x.id === id)!, o.macros);
        n++; if (sameBenefits(o.macros, m.macros).equivalent) ok++;
      }
    }
    expect(ok / n).toBeGreaterThanOrEqual(0.8);
  });
});
