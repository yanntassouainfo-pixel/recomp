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
    const westAfrican = ['attieke', 'yam_boiled', 'cassava_boiled', 'foutou', 'plantain_boiled', 'maize_porridge', 'millet_couscous', 'smoked_fish', 'tilapia', 'mackerel', 'okra', 'leafy_greens', 'peanuts', 'palm_oil', 'papaya', 'mango'];
    expect(ids.some((id) => westAfrican.includes(id))).toBe(true);
    for (const m of plan.meals) expect(m.items.some((i) => i.role === 'protein')).toBe(true);
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
