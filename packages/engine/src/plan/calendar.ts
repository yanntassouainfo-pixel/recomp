import type { ISODate, UserState } from '../types';
import { addDays } from '../stats';
import type { ProgramPlan } from './periodization';

export type EventKind = 'session' | 'measure' | 'photos' | 'review' | 'deload' | 'diet_break' | 'phase' | 'life_event' | 'end';
export type EventStatus = 'planned' | 'done' | 'missed' | 'today';

export interface CalendarEvent {
  id: string;
  date: ISODate;
  kind: EventKind;
  title: string;
  detail?: string;
  status: EventStatus;
  workoutDayId?: string;
}

/** Événements du calendrier entre deux dates, avec l'état réel (fait / manqué) lu dans l'historique. */
export function buildCalendar(state: UserState, plan: ProgramPlan, from: ISODate, to: ISODate, today: ISODate): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const statusFor = (date: ISODate, done: boolean): EventStatus => (done ? 'done' : date === today ? 'today' : date < today ? 'missed' : 'planned');

  for (const w of plan.weeks) {
    if (w.endDate < from || w.startDate > to) continue;
    for (const s of w.sessions) {
      if (s.date < from || s.date > to) continue;
      const done = state.sessions.some((x) => x.date === s.date && x.completed);
      const realized = state.sessions.find((x) => x.date === s.date);
      const skipped = realized && realized.planned && !realized.completed && s.date < today;
      events.push({ id: `s_${s.date}`, date: s.date, kind: 'session', title: s.name, detail: w.isDeload ? 'Version allégée' : undefined, status: skipped ? 'missed' : statusFor(s.date, done), workoutDayId: s.workoutDayId });
    }
    if (w.measurementDate >= from && w.measurementDate <= to) {
      const done = state.measurements.some((m) => m.date === w.measurementDate && typeof m.waistCm === 'number');
      events.push({ id: `m_${w.measurementDate}`, date: w.measurementDate, kind: 'measure', title: 'Tour de taille + poids', status: statusFor(w.measurementDate, done) });
      events.push({ id: `r_${w.reviewDate}`, date: w.reviewDate, kind: 'review', title: `Bilan semaine ${w.weekNumber}`, status: w.reviewDate <= today ? 'done' : 'planned' });
    }
    if (w.photoDate && w.photoDate >= from && w.photoDate <= to) {
      const done = state.photos.some((p) => Math.abs((Date.parse(p.date) - Date.parse(w.photoDate!)) / 86_400_000) <= 3);
      events.push({ id: `p_${w.photoDate}`, date: w.photoDate, kind: 'photos', title: 'Photos de suivi', detail: 'Même lumière, même distance, même posture', status: statusFor(w.photoDate, done) });
    }
  }
  for (const m of plan.milestones) {
    if (m.date < from || m.date > to) continue;
    if (m.kind === 'photos') continue; // déjà couvert par les semaines
    events.push({ id: `ms_${m.date}_${m.kind}`, date: m.date, kind: m.kind === 'phase' ? 'phase' : m.kind, title: m.label, status: m.date < today ? 'done' : m.date === today ? 'today' : 'planned' });
  }
  for (const e of state.lifeEvents) {
    let d = e.startDate;
    while (d <= e.endDate) {
      if (d >= from && d <= to) events.push({ id: `le_${e.id}_${d}`, date: d, kind: 'life_event', title: e.type, status: d < today ? 'done' : d === today ? 'today' : 'planned' });
      d = addDays(d, 1);
    }
  }
  return events.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.kind < b.kind ? -1 : 1));
}

export interface WeekSummary {
  weekNumber: number;
  phaseName: string;
  sessionsPlanned: number;
  sessionsDone: number;
  nextSession: { date: ISODate; name: string } | null;
  pending: string[];
}

export function summarizeWeek(state: UserState, plan: ProgramPlan, today: ISODate): WeekSummary | null {
  const w = plan.weeks.find((x) => x.startDate <= today && x.endDate >= today);
  if (!w) return null;
  const phase = plan.phases.find((p) => p.id === w.phaseId);
  const done = w.sessions.filter((s) => state.sessions.some((x) => x.date === s.date && x.completed)).length;
  const next = w.sessions.find((s) => s.date >= today && !state.sessions.some((x) => x.date === s.date && x.completed)) ?? null;
  const pending: string[] = [];
  if (w.sessions.length - done > 0) pending.push(`${w.sessions.length - done} séance${w.sessions.length - done > 1 ? 's' : ''} restante${w.sessions.length - done > 1 ? 's' : ''}`);
  if (!state.measurements.some((m) => m.date >= w.startDate && m.date <= w.endDate && typeof m.waistCm === 'number')) pending.push(`tour de taille (${w.measurementDate === today ? 'aujourd’hui' : 'dimanche'})`);
  if (w.photoDate && !state.photos.some((p) => p.date >= w.startDate && p.date <= w.endDate)) pending.push('photos de suivi');
  return { weekNumber: w.weekNumber, phaseName: phase?.name ?? '', sessionsPlanned: w.sessions.length, sessionsDone: done, nextSession: next ? { date: next.date, name: next.name } : null, pending };
}
