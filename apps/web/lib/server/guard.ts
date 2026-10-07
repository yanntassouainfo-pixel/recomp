import { NextResponse } from 'next/server';

/**
 * Garde minimale des routes API avant une exposition publique :
 * - clé bêta partagée (BETA_ACCESS_KEY) exigée dans l'en-tête x-recomp-beta-key si elle est définie ;
 * - limitation de débit par adresse, en mémoire (suffisant pour une bêta sur une instance ; passer à Upstash/KV ensuite).
 * TODO production : authentification Supabase par utilisateur.
 */
const WINDOW_MS = 10 * 60 * 1000;
const buckets = new Map<string, { count: number; reset: number }>();

function ipOf(req: Request): string {
  return (req.headers.get('x-forwarded-for') ?? '').split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
}

export function guard(req: Request, limit: number): NextResponse | null {
  const required = process.env.BETA_ACCESS_KEY;
  if (required) {
    const given = req.headers.get('x-recomp-beta-key') ?? '';
    if (given !== required) return NextResponse.json({ error: 'beta_key_required' }, { status: 401 });
  }
  const ip = ipOf(req);
  const now = Date.now();
  const b = buckets.get(ip);
  if (!b || b.reset < now) buckets.set(ip, { count: 1, reset: now + WINDOW_MS });
  else if (b.count >= limit) return NextResponse.json({ error: 'rate_limited', retryAfterSec: Math.ceil((b.reset - now) / 1000) }, { status: 429 });
  else b.count += 1;
  if (buckets.size > 5000) for (const [k, v] of buckets) if (v.reset < now) buckets.delete(k);
  return null;
}
