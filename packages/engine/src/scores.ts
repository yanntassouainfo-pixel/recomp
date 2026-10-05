import type {
  BodyCompositionScore,
  DailyCheckin,
  ISODate,
  RecoveryScore,
  ScoreDriver,
  UserState,
  VitalityScore,
  ReadinessLevel,
} from './types';
import { addDays, clamp, e1rm, inWindow, linearTrend, mean, rollingMean, round } from './stats';

// ---------- Séries ----------

export function weightSeries(state: UserState) {
  return state.measurements
    .filter((m) => typeof m.weightKg === 'number')
    .map((m) => ({ date: m.date, value: m.weightKg as number }));
}

export function weightRolling(state: UserState) {
  return rollingMean(weightSeries(state), 7);
}

export function waistSeries(state: UserState) {
  return state.measurements
    .filter((m) => typeof m.waistCm === 'number')
    .map((m) => ({ date: m.date, value: m.waistCm as number }));
}

/** Mouvements clés pour la force : on prend la moyenne des e1RM normalisés par exercice. */
export const KEY_LIFTS = ['bench_press', 'squat', 'deadlift', 'overhead_press', 'row_barbell', 'pull_up', 'db_bench', 'goblet_squat', 'romanian_deadlift', 'lat_pulldown'];

export function strengthSeries(state: UserState): { date: ISODate; value: number }[] {
  // Indice de force = moyenne, par date, du e1RM relatif à la première valeur connue de chaque exercice (100 = départ).
  const byExercise = new Map<string, { date: ISODate; value: number }[]>();
  for (const log of state.performance) {
    if (!KEY_LIFTS.includes(log.exerciseId)) continue;
    const best = Math.max(...log.sets.map((s) => e1rm(s.weightKg, s.reps, s.rir ?? 0)));
    if (!Number.isFinite(best)) continue;
    const arr = byExercise.get(log.exerciseId) ?? [];
    arr.push({ date: log.date, value: best });
    byExercise.set(log.exerciseId, arr);
  }
  const normalized: { date: ISODate; value: number }[] = [];
  for (const arr of byExercise.values()) {
    arr.sort((a, b) => (a.date < b.date ? -1 : 1));
    const base = arr[0]!.value;
    for (const p of arr) normalized.push({ date: p.date, value: (p.value / base) * 100 });
  }
  // moyenne par date
  const byDate = new Map<ISODate, number[]>();
  for (const p of normalized) byDate.set(p.date, [...(byDate.get(p.date) ?? []), p.value]);
  return [...byDate.entries()]
    .map(([date, vals]) => ({ date, value: round(mean(vals), 1) }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}

/** Variation de l'indice de force sur 28 jours (tendance linéaire), source unique pour score, KPI et revue. */
export function strengthDelta28d(state: UserState, today: ISODate) {
  return linearTrend(inWindow(strengthSeries(state), addDays(today, -27), today), 0.2);
}

/** Variation du tour de taille sur 28 jours (dernier point − premier point de la fenêtre). */
export function waistDelta28d(state: UserState, today: ISODate): number | null {
  const w = inWindow(waistSeries(state), addDays(today, -27), today);
  return w.length >= 2 ? round(w[w.length - 1]!.value - w[0]!.value, 1) : null;
}

export function sessionAdherence(state: UserState, from: ISODate, to: ISODate): number | null {
  const planned = inWindow(state.sessions, from, to).filter((s) => s.planned);
  if (planned.length === 0) return null;
  return planned.filter((s) => s.completed).length / planned.length;
}

export function checkinsIn(state: UserState, from: ISODate, to: ISODate): DailyCheckin[] {
  return inWindow(state.checkins, from, to);
}

// ---------- Body Composition Score ----------

function signalToText(key: string, signal: number): string {
  const s = signal;
  switch (key) {
    case 'waist':
      return s > 0.2 ? 'Ton tour de taille diminue : c’est le signal le plus fiable d’une perte de graisse abdominale.' : s < -0.2 ? 'Ton tour de taille augmente légèrement. À surveiller sur 2 semaines avant de conclure.' : 'Tour de taille stable.';
    case 'strength':
      return s > 0.2 ? 'Tes performances progressent : ta masse musculaire est au minimum préservée.' : s < -0.2 ? 'Tes performances baissent. Récupération ou déficit trop fort à vérifier.' : 'Force stable.';
    case 'weight':
      return s >= 0 ? 'Ton poids évolue de manière cohérente avec ton objectif de recomposition.' : 'Ton poids évolue plus vite que prévu. Ce n’est pas forcément bon signe.';
    case 'adherence':
      return s > 0.2 ? 'Ta régularité d’entraînement est bonne.' : s < -0.2 ? 'Des séances ont sauté : c’est le premier levier à récupérer.' : 'Régularité correcte.';
    case 'sleep':
      return s > 0.2 ? 'Ton sommeil soutient la recomposition.' : s < -0.2 ? 'Sommeil insuffisant : il freine la perte de gras et la récupération.' : 'Sommeil correct.';
    case 'recovery':
      return s > 0.2 ? 'Énergie et récupération au rendez-vous.' : s < -0.2 ? 'Énergie basse : on protège la récupération.' : 'Récupération correcte.';
    case 'photos':
      return s > 0.2 ? 'Tes photos confirment visuellement l’évolution.' : s < -0.2 ? 'Tes photos ne montrent pas encore de changement visible : c’est normal avant 6–8 semaines.' : 'Photos : pas de changement marqué.';
    default:
      return '';
  }
}

export function computeBodyCompositionScore(state: UserState, today: ISODate): BodyCompositionScore {
  const from = addDays(today, -27);
  const prevFrom = addDays(today, -55);
  const prevTo = addDays(today, -28);
  const drivers: ScoreDriver[] = [];
  const goal = state.profile.primaryGoal;

  // Tour de taille : -1 cm / 4 semaines ≈ bon ; -2 cm excellent
  const waistTrend = linearTrend(inWindow(waistSeries(state), prevFrom, today), 0.1);
  if (waistTrend && waistTrend.points >= 3) {
    const perMonth = waistTrend.slopePerWeek * 4;
    let signal = clamp(-perMonth / 2, -1, 1);
    if (goal === 'muscle_gain') signal = clamp(-perMonth / 3, -1, 1); // tolérance en prise de masse
    drivers.push({ key: 'waist', label: 'Tour de taille', signal, weight: 0.3, text: signalToText('waist', signal) });
  }

  // Force : +3 % / mois ≈ bon — même fenêtre et même calcul que la revue hebdo et le KPI (strengthDelta28d)
  const strTrend = strengthDelta28d(state, today);
  if (strTrend && strTrend.points >= 3) {
    const perMonth = strTrend.delta;
    const signal = clamp(perMonth / 3, -1, 1);
    drivers.push({ key: 'strength', label: 'Force', signal, weight: 0.2, text: signalToText('strength', signal) });
  }

  // Poids : interprété selon l'objectif. En recomposition, stable = +0.3 ; perte lente = +0.5 ; perte rapide (>0.7%/sem) = -0.5
  const wTrend = linearTrend(inWindow(weightRolling(state), prevFrom, today), 0.05);
  if (wTrend && wTrend.points >= 5) {
    const pctPerWeek = (wTrend.slopePerWeek / wTrend.first) * 100;
    let signal = 0;
    if (goal === 'recomposition' || goal === 'definition' || goal === 'athletic') {
      if (Math.abs(pctPerWeek) <= 0.25) signal = 0.4;
      else if (pctPerWeek < 0 && pctPerWeek >= -0.7) signal = 0.5;
      else if (pctPerWeek < -0.7) signal = -0.6;
      else signal = 0.1; // légère prise : neutre si taille baisse
    } else if (goal === 'fat_loss') {
      if (pctPerWeek <= -0.3 && pctPerWeek >= -0.8) signal = 0.6;
      else if (pctPerWeek < -0.8) signal = -0.5;
      else if (pctPerWeek > 0.2) signal = -0.3;
      else signal = 0.1;
    } else if (goal === 'muscle_gain') {
      if (pctPerWeek >= 0.1 && pctPerWeek <= 0.5) signal = 0.6;
      else if (pctPerWeek > 0.5) signal = -0.2;
      else signal = 0.1;
    } else signal = 0.2;
    drivers.push({ key: 'weight', label: 'Poids (tendance 7 j)', signal, weight: 0.1, text: signalToText('weight', signal) });
  }

  const adh = sessionAdherence(state, from, today);
  if (adh !== null) {
    const signal = clamp((adh - 0.6) / 0.3, -1, 1);
    drivers.push({ key: 'adherence', label: 'Régularité', signal, weight: 0.15, text: signalToText('adherence', signal) });
  }

  const cks = checkinsIn(state, from, today);
  if (cks.length >= 5) {
    const sleep = mean(cks.map((c) => c.sleepHours));
    const q = mean(cks.map((c) => c.sleepQuality));
    const signal = clamp((sleep - 6.5) / 1.5, -1, 1) * 0.6 + clamp((q - 3) / 2, -1, 1) * 0.4;
    drivers.push({ key: 'sleep', label: 'Sommeil', signal, weight: 0.1, text: signalToText('sleep', signal) });
    const energy = mean(cks.map((c) => c.energy));
    const soreness = mean(cks.map((c) => c.soreness));
    const rec = clamp((energy - 3) / 2, -1, 1) * 0.6 + clamp((3 - soreness) / 2, -1, 1) * 0.4;
    drivers.push({ key: 'recovery', label: 'Énergie & récupération', signal: rec, weight: 0.1, text: signalToText('recovery', rec) });
  }

  const recentPhotos = inWindow(state.photos, prevFrom, today).filter((p) => p.selfAssessment);
  if (recentPhotos.length > 0) {
    const map = { worse: -1, same: 0, better: 1 } as const;
    const signal = mean(recentPhotos.map((p) => map[p.selfAssessment!]));
    drivers.push({ key: 'photos', label: 'Photos', signal, weight: 0.05, text: signalToText('photos', signal) });
  }

  if (drivers.length < 2) {
    return { score: 50, trend: 'insufficient_data', drivers, headline: 'Encore un peu de données et ton score prendra sens. Mesure ton tour de taille cette semaine.' };
  }

  const totalW = drivers.reduce((a, d) => a + d.weight, 0);
  const weighted = drivers.reduce((a, d) => a + d.signal * (d.weight / totalW), 0); // -1..1
  const score = Math.round(clamp(50 + weighted * 50, 0, 100));
  const trend = weighted > 0.15 ? 'improving' : weighted < -0.15 ? 'worsening' : 'stable';

  const waist = drivers.find((d) => d.key === 'waist');
  const str = drivers.find((d) => d.key === 'strength');
  const w = drivers.find((d) => d.key === 'weight');
  let headline = 'Évolution stable. On continue d’observer.';
  if (waist && waist.signal > 0.2 && w && Math.abs((wTrend?.slopePerWeek ?? 0)) < 0.25) {
    headline = 'Ton poids bouge peu mais ton tour de taille baisse' + (str && str.signal > 0.2 ? ' et ta force progresse. C’est exactement le type d’évolution que nous recherchons.' : '. C’est une recomposition qui commence.');
  } else if (waist && waist.signal > 0.2) {
    headline = 'Ton tour de taille diminue : la graisse abdominale recule.';
  } else if (str && str.signal < -0.2 && w && wTrend && wTrend.slopePerWeek < -0.4) {
    headline = 'Tu perds du poids mais ta force baisse : on ralentit pour protéger le muscle.';
  } else if (trend === 'worsening') {
    headline = 'Plusieurs signaux sont en retrait. Rien d’alarmant : on identifie le premier levier dans ta revue.';
  }
  return { score, trend, drivers, headline };
}

// ---------- Vitality Score ----------

export function computeVitalityScore(state: UserState, today: ISODate): VitalityScore {
  const from = addDays(today, -13);
  const cks = checkinsIn(state, from, today);
  if (cks.length === 0) {
    return { score: 0, components: [], headline: 'Fais ton premier check-in pour calculer ta vitalité.' };
  }
  const n = cks.length;
  const comp: ScoreDriver[] = [];
  const push = (key: string, label: string, v01: number, weight: number, text: string) =>
    comp.push({ key, label, signal: v01 * 2 - 1, weight, text });

  const energy = mean(cks.map((c) => c.energy));
  push('energy', 'Énergie', (energy - 1) / 4, 0.2, `Énergie moyenne ${round(energy, 1)}/5`);
  const sleepH = mean(cks.map((c) => c.sleepHours));
  const sleepQ = mean(cks.map((c) => c.sleepQuality));
  const sleep01 = clamp((sleepH - 5) / 3, 0, 1) * 0.6 + ((sleepQ - 1) / 4) * 0.4;
  push('sleep', 'Sommeil', sleep01, 0.2, `${round(sleepH, 1)} h en moyenne, qualité ${round(sleepQ, 1)}/5`);
  const soreness = mean(cks.map((c) => c.soreness));
  push('recovery', 'Récupération', 1 - (soreness - 1) / 4, 0.12, `Courbatures ${round(soreness, 1)}/5`);
  const steps = cks.map((c) => c.steps).filter((s): s is number => typeof s === 'number');
  if (steps.length) {
    const avg = mean(steps);
    push('activity', 'Activité', clamp(avg / 9000, 0, 1), 0.12, `${Math.round(avg)} pas/jour`);
  }
  const mood = mean(cks.map((c) => c.mood));
  push('mood', 'Humeur', (mood - 1) / 4, 0.12, `Humeur ${round(mood, 1)}/5`);
  const stress = mean(cks.map((c) => c.stress));
  push('stress', 'Stress', 1 - (stress - 1) / 4, 0.12, `Stress ${round(stress, 1)}/5`);
  push('regularity', 'Régularité des check-ins', n / 14, 0.12, `${n} check-ins sur 14 jours`);

  const totalW = comp.reduce((a, c) => a + c.weight, 0);
  const v01 = comp.reduce((a, c) => a + ((c.signal + 1) / 2) * (c.weight / totalW), 0);
  const score = round(v01 * 10, 1);
  let headline = 'Vitalité correcte.';
  if (score >= 7.5) headline = 'Bonne vitalité : ton corps encaisse bien le programme.';
  else if (score < 5) headline = 'Vitalité basse. Un résultat corporel sans énergie n’est pas un succès : on protège la récupération cette semaine.';
  return { score, components: comp, headline };
}

// ---------- Recovery Score ----------

export function computeRecoveryScore(state: UserState, today: ISODate, todayCheckin?: DailyCheckin | null): RecoveryScore {
  const ck = todayCheckin ?? state.checkins.find((c) => c.date === today) ?? null;
  const last7 = inWindow(state.sessions, addDays(today, -6), today).filter((s) => s.completed).length;
  const reasons: string[] = [];
  let score = 70;

  if (ck) {
    score = 0;
    score += clamp((ck.sleepHours - 4) / 4, 0, 1) * 25;
    score += ((ck.sleepQuality - 1) / 4) * 15;
    score += ((ck.energy - 1) / 4) * 20;
    score += (1 - (ck.stress - 1) / 4) * 15;
    score += (1 - (ck.soreness - 1) / 4) * 15;
    score += ((ck.motivation - 1) / 4) * 10;
    if (ck.sleepHours < 6) reasons.push('Nuit courte (< 6 h)');
    if (ck.stress >= 4) reasons.push('Stress élevé');
    if (ck.soreness >= 4) reasons.push('Courbatures marquées');
    if (ck.energy <= 2) reasons.push('Énergie basse');
  } else {
    reasons.push('Pas de check-in aujourd’hui : estimation à partir des derniers jours');
    const recent = inWindow(state.checkins, addDays(today, -3), today);
    if (recent.length) {
      const e = mean(recent.map((c) => c.energy));
      score = 50 + (e - 3) * 10;
    }
  }
  if (last7 >= state.profile.sessionsPerWeek + 1) {
    score -= 10;
    reasons.push('Charge d’entraînement supérieure au plan sur 7 jours');
  }
  // Tendance de perf récente
  const str = linearTrend(inWindow(strengthSeries(state), addDays(today, -13), today), 0.3);
  if (str && str.direction === 'down' && str.points >= 2) {
    score -= 8;
    reasons.push('Performances en baisse sur 2 semaines');
  }
  score = Math.round(clamp(score, 0, 100));

  let readiness: ReadinessLevel = 'normal';
  if (ck?.pain?.unusual && ck.pain.severity >= 3) readiness = 'rest';
  else if (score >= 80) readiness = 'push';
  else if (score >= 55) readiness = 'normal';
  else if (score >= 35) readiness = 'light';
  else readiness = 'rest';

  const suggestion: Record<ReadinessLevel, string> = {
    push: 'Forme excellente : séance prévue, tu peux viser le haut des fourchettes.',
    normal: 'Forme correcte : séance prévue telle quelle.',
    light: 'Fatigue notable : on retire une série par exercice et on reste à 2–3 reps en réserve.',
    rest: ck?.pain?.unusual
      ? 'Douleur inhabituelle signalée : pas de séance sur cette zone aujourd’hui. Si elle persiste plus de quelques jours, consulte un professionnel.'
      : 'Récupération prioritaire : marche 20–30 min, mobilité, coucher tôt. La séance est décalée, pas perdue.',
  };
  return { score, readiness, reasons, suggestion: suggestion[readiness] };
}
