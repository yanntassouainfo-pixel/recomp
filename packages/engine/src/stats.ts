import type { ISODate, Trend } from './types';

export function toISODate(d: Date): ISODate {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseISO(s: ISODate): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

export function addDays(s: ISODate, n: number): ISODate {
  const d = parseISO(s);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

export function daysBetween(a: ISODate, b: ISODate): number {
  return Math.round((parseISO(b).getTime() - parseISO(a).getTime()) / 86_400_000);
}

export function dayOfWeek(s: ISODate): number {
  return parseISO(s).getDay();
}

export function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x));
}

export function round(x: number, decimals = 1): number {
  const f = 10 ** decimals;
  return Math.round(x * f) / f;
}

export function mean(xs: number[]): number {
  if (xs.length === 0) return NaN;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

export function last<T>(xs: T[]): T | undefined {
  return xs[xs.length - 1];
}

/** Filtre les éléments datés dans [from, to] inclus. */
export function inWindow<T extends { date: ISODate }>(xs: T[], from: ISODate, to: ISODate): T[] {
  return xs.filter((x) => x.date >= from && x.date <= to);
}

/** Moyenne glissante sur `window` jours pour une série {date, value}. */
export function rollingMean(series: { date: ISODate; value: number }[], window = 7): { date: ISODate; value: number }[] {
  const sorted = [...series].sort((a, b) => (a.date < b.date ? -1 : 1));
  return sorted.map((pt, i) => {
    const from = addDays(pt.date, -(window - 1));
    const vals = sorted.filter((p, j) => j <= i && p.date >= from).map((p) => p.value);
    return { date: pt.date, value: round(mean(vals), 2) };
  });
}

/**
 * Régression linéaire simple sur une série datée. Pente exprimée par semaine.
 * `flatThreshold` : en dessous de |pente| (unités/semaine), direction = flat.
 */
export function linearTrend(series: { date: ISODate; value: number }[], flatThreshold: number): Trend | null {
  const pts = [...series].filter((p) => Number.isFinite(p.value)).sort((a, b) => (a.date < b.date ? -1 : 1));
  if (pts.length < 2) return null;
  const t0 = pts[0]!.date;
  const xs = pts.map((p) => daysBetween(t0, p.date) / 7);
  const ys = pts.map((p) => p.value);
  const mx = mean(xs);
  const my = mean(ys);
  let num = 0;
  let den = 0;
  for (let i = 0; i < xs.length; i++) {
    num += (xs[i]! - mx) * (ys[i]! - my);
    den += (xs[i]! - mx) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  const first = ys[0]!;
  const lastV = ys[ys.length - 1]!;
  return {
    slopePerWeek: round(slope, 3),
    delta: round(lastV - first, 2),
    first,
    last: lastV,
    points: pts.length,
    direction: Math.abs(slope) < flatThreshold ? 'flat' : slope > 0 ? 'up' : 'down',
  };
}

/** Estimation de 1RM (Epley). */
export function e1rm(weightKg: number, reps: number, rir = 0): number {
  const effectiveReps = reps + rir;
  if (effectiveReps <= 1) return weightKg;
  return weightKg * (1 + effectiveReps / 30);
}

/** Générateur pseudo-aléatoire déterministe (mulberry32) pour la démo. */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function uid(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}
