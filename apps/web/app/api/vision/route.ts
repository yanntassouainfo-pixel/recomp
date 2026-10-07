import { NextResponse } from 'next/server';
import { guard } from '@/lib/server/guard';
import { z } from 'zod';
import { analyzePhotos, providersFromEnv } from '@recomp/ai';

export const runtime = 'nodejs';

const MAX_IMAGE_B64 = 2_200_000; // ≈ 1,6 Mo décodé ; les photos sont réduites à 1280 px côté client
const Img = z.object({ data: z.string().min(100).max(MAX_IMAGE_B64), mediaType: z.enum(['image/jpeg', 'image/png', 'image/webp']), view: z.enum(['front', 'side', 'back']), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) });
const Body = z.object({
  consent: z.literal(true),
  current: Img,
  previous: Img.optional(),
  profile: z.object({ sex: z.string().max(10), age: z.number().int().min(14).max(100), heightCm: z.number().min(100).max(250), primaryGoal: z.string().max(40), visualGoals: z.array(z.string().max(40)).max(12), fatStorage: z.array(z.string().max(20)).max(8) }),
  context: z.object({ waistDeltaCm: z.number().nullable().optional(), weightDeltaKg: z.number().nullable().optional(), strengthDeltaPct: z.number().nullable().optional(), weeksBetween: z.number().nullable().optional() }).optional(),
});

/**
 * POST /api/vision — analyse IA d'une ou deux photos de suivi.
 * Consentement explicite exigé dans la requête. Les images ne sont ni journalisées ni stockées côté serveur.
 * TODO production : authentification, rate-limit par utilisateur, consentement vérifié en base.
 */
export async function POST(req: Request) {
  const blocked = guard(req, 12);
  if (blocked) return blocked;
  const len = Number(req.headers.get('content-length') ?? '0');
  if (len > 5_000_000) return NextResponse.json({ error: 'payload_too_large' }, { status: 413 });
  let json: unknown;
  try { json = JSON.parse(await req.text()); } catch { return NextResponse.json({ error: 'invalid_request' }, { status: 400 }); }
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.path.join('.') === 'consent' ? 'consent_required' : 'invalid_request' }, { status: 400 });
  const { provider, fallback } = providersFromEnv(process.env as Record<string, string | undefined>);
  const candidates = [provider, fallback].filter((p): p is NonNullable<typeof p> => Boolean(p && p.completeVision));
  if (candidates.length === 0) return NextResponse.json({ error: 'no_vision_provider' }, { status: 503 });
  for (const p of candidates) {
    try {
      const r = await analyzePhotos(p, { current: parsed.data.current, previous: parsed.data.previous, profile: parsed.data.profile, context: parsed.data.context });
      if (r.ok || r.refused) return NextResponse.json(r);
    } catch {
      // fournisseur suivant
    }
  }
  return NextResponse.json({ error: 'analysis_failed' }, { status: 502 });
}
