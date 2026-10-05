import type { EvidenceId, ISODate, UserState } from '../types';
import { addDays, daysBetween, inWindow, linearTrend, mean } from '../stats';
import { checkinsIn, sessionAdherence, strengthSeries, waistSeries, weightRolling } from '../scores';

export interface Alert {
  id: string;
  level: 'success' | 'info' | 'warning' | 'safety';
  text: string;
  evidenceId?: EvidenceId;
}

/** Alertes utiles seulement. Pas de spam. */
export function computeAlerts(state: UserState, today: ISODate): Alert[] {
  const alerts: Alert[] = [];
  const win = addDays(today, -20);
  const w = linearTrend(inWindow(weightRolling(state), win, today), 0.0001);
  const wa = linearTrend(inWindow(waistSeries(state), addDays(today, -27), today), 0.0001);
  const st = linearTrend(inWindow(strengthSeries(state), addDays(today, -13), today), 0.3);
  const cks = checkinsIn(state, addDays(today, -6), today);

  if (w && w.points >= 14 && Math.abs((w.slopePerWeek / w.first) * 100) < 0.2 && wa && wa.delta <= -1) {
    alerts.push({ id: 'stable_weight_waist_down', level: 'success', text: `Ton poids est stable depuis 3 semaines, mais ton tour de taille a baissé de ${Math.abs(wa.delta)} cm. Continue.`, evidenceId: 'waist_marker' });
  }
  if (st && st.direction === 'down' && cks.length >= 3 && mean(cks.map((c) => c.sleepHours)) < 6.5) {
    alerts.push({ id: 'perf_down_sleep_down', level: 'warning', text: 'Tes performances diminuent depuis deux séances et ton sommeil est dégradé. Aujourd’hui, nous allégeons la séance.', evidenceId: 'readiness_autoregulation' });
  }
  const adh = sessionAdherence(state, addDays(today, -27), today);
  const lastPhoto = [...state.photos].sort((a, b) => (a.date < b.date ? 1 : -1))[0];
  if (adh !== null && adh >= 0.8 && (!lastPhoto || daysBetween(lastPhoto.date, today) >= 28)) {
    alerts.push({ id: 'photos_due', level: 'info', text: 'Tu as été régulier 4 semaines. Il est temps de refaire tes photos (même lumière, même distance, même posture).' });
  }
  if (w && w.points >= 14 && (w.slopePerWeek / w.first) * 100 < -1) {
    alerts.push({ id: 'fast_loss', level: 'safety', text: 'Perte de poids supérieure à 1 % par semaine sur 3 semaines. Ce rythme coûte du muscle : on remonte les apports. Si tu ne cherches pas à perdre aussi vite, parle-en à un professionnel.', evidenceId: 'deficit_rate' });
  }
  const painStreak = cks.filter((c) => c.pain && c.pain.severity >= 3).length;
  if (painStreak >= 3) {
    alerts.push({ id: 'pain_persist', level: 'safety', text: 'Douleur signalée plusieurs jours de suite. Ce n’est plus du coaching : une évaluation par un professionnel de santé est recommandée.' });
  }
  if (cks.length >= 5 && mean(cks.map((c) => c.energy)) <= 2 && mean(cks.map((c) => c.mood)) <= 2) {
    alerts.push({ id: 'low_vitality', level: 'warning', text: 'Énergie et humeur basses toute la semaine. Un résultat corporel ne vaut pas une semaine épuisée : séances allégées, sommeil prioritaire, apports à maintenance.' , evidenceId: 'sleep_and_fat_loss' });
  }
  const lastMeasure = [...state.measurements].filter((m) => m.waistCm).sort((a, b) => (a.date < b.date ? 1 : -1))[0];
  if (lastMeasure && daysBetween(lastMeasure.date, today) >= 10) {
    alerts.push({ id: 'waist_due', level: 'info', text: 'Pas de tour de taille depuis plus de 10 jours : c’est ta mesure la plus utile. 30 secondes demain matin à jeun.', evidenceId: 'waist_marker' });
  }
  return alerts;
}
