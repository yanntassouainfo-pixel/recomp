import { NextResponse } from 'next/server';
import { computeState, type UserState } from '@recomp/engine';
import { answerQuestion, providersFromEnv, type ChatMessage } from '@recomp/ai';

export const runtime = 'nodejs';

/**
 * POST /api/coach
 * body: { question: string; state: UserState; today: string; history?: ChatMessage[] }
 * Le moteur recalcule l'état côté serveur (source de vérité), puis l'orchestrateur répond :
 * LLM contraint si une clé est configurée, coach à règles sinon.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { question: string; state: UserState; today: string; history?: ChatMessage[] };
    if (!body?.question || !body?.state) return NextResponse.json({ error: 'question et state requis' }, { status: 400 });
    const computed = computeState(body.state, body.today);
    const { provider, fallback } = providersFromEnv(process.env as Record<string, string | undefined>);
    const answer = await answerQuestion(body.question, body.state, computed, { provider, fallback, history: body.history ?? [] });
    return NextResponse.json(answer);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
