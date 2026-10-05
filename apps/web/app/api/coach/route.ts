import { NextResponse } from 'next/server';
import { z } from 'zod';
import { computeState, type UserState } from '@recomp/engine';
import { answerQuestion, providersFromEnv, type ChatMessage } from '@recomp/ai';

export const runtime = 'nodejs';

const MAX_BODY_BYTES = 256 * 1024;

const Body = z.object({
  question: z.string().trim().min(1).max(1000),
  today: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  history: z.array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().max(2000) })).max(8).optional(),
  // L'état est validé structurellement ; les photos sont ignorées côté serveur quoi qu'il arrive.
  state: z.object({
    profile: z.object({ id: z.string().max(64) }).passthrough(),
    measurements: z.array(z.object({ date: z.string() }).passthrough()).max(2000),
    checkins: z.array(z.object({ date: z.string() }).passthrough()).max(2000),
    sessions: z.array(z.object({ date: z.string() }).passthrough()).max(2000),
    performance: z.array(z.object({ date: z.string() }).passthrough()).max(5000),
    meals: z.array(z.object({ date: z.string() }).passthrough()).max(5000),
    lifeEvents: z.array(z.object({ type: z.string() }).passthrough()).max(200),
    photos: z.array(z.object({ id: z.string() }).passthrough()).max(200),
    decisions: z.array(z.object({ date: z.string() }).passthrough()).max(500),
  }).passthrough(),
});

/**
 * POST /api/coach
 * Le moteur recalcule l'état côté serveur (source de vérité), puis l'orchestrateur répond :
 * LLM contraint si une clé est configurée, coach à règles sinon.
 * TODO production : authentification Supabase, état relu depuis la base (jamais depuis le client),
 * consentement « coach IA tiers » vérifié avant tout appel LLM, rate-limit par utilisateur.
 */
export async function POST(req: Request) {
  const len = Number(req.headers.get('content-length') ?? '0');
  if (len > MAX_BODY_BYTES) return NextResponse.json({ error: 'payload_too_large' }, { status: 413 });
  let json: unknown;
  try {
    const text = await req.text();
    if (text.length > MAX_BODY_BYTES) return NextResponse.json({ error: 'payload_too_large' }, { status: 413 });
    json = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  try {
    const state = { ...parsed.data.state, photos: parsed.data.state.photos.map((p) => ({ ...p, uri: '' })) } as unknown as UserState;
    const computed = computeState(state, parsed.data.today);
    const { provider, fallback } = providersFromEnv(process.env as Record<string, string | undefined>);
    const answer = await answerQuestion(parsed.data.question, state, computed, { provider, fallback, history: (parsed.data.history ?? []) as ChatMessage[] });
    return NextResponse.json(answer);
  } catch {
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
