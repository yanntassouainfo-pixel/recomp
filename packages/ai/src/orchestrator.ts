import { buildContextPack, COACH_SYSTEM_PROMPT, rulesCoach, type ComputedState, type UserState } from '@recomp/engine';
import type { ChatMessage, CoachAnswer, Intent, LLMProvider, OrchestratorOptions } from './types';
import { anthropicProvider } from './providers/anthropic';
import { openAICompatibleProvider } from './providers/openai';

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/**
 * AI ORCHESTRATOR
 * 1. classifie l'intention ;
 * 2. applique les garde-fous d'entrée (sécurité → toujours déterministe) ;
 * 3. route : LLM contraint par le context pack, ou coach à règles ;
 * 4. applique les garde-fous de sortie.
 */
export function classifyIntent(question: string): Intent {
  const q = norm(question);
  if (/(vomir|laxatif|me degoute|deteste mon corps|arreter de manger|me faire du mal|suicid)/.test(q)) return 'safety';
  if (/(photo|masse grasse|% de gras|pourcentage)/.test(q)) return 'vision';
  if (/(mange|manger|repas|diner|dejeuner|petit dej|proteine|glucide|riz|poulet|faim|jeune|calorie)/.test(q)) return 'nutrition';
  if (/(seance|entrain|exercice|charge|serie|rep|muscu|squat|developpe|fatigue|douleur)/.test(q)) return 'training';
  if (/(poids|plateau|bilan|progres|score|tour de taille|resultat|ou j en suis)/.test(q)) return 'analysis';
  return 'conversation';
}

const OUTPUT_GUARDRAILS: { id: string; test: RegExp; fix: (t: string) => string }[] = [
  {
    id: 'no_bodyfat_percent_from_photo',
    test: /(\d{1,2}\s?%\s?(de\s)?(masse\s)?gras)|(masse grasse[^.]{0,40}\d{1,2}\s?%)/i,
    fix: (t) => t.replace(/(\d{1,2}\s?%\s?(de\s)?(masse\s)?gras(se)?)/gi, 'un niveau de masse grasse que je ne peux pas chiffrer à partir d’une photo'),
  },
  {
    id: 'no_compensation',
    test: /(brule|brûle|compense|rattrape)[^.]{0,30}(demain|calories)/i,
    fix: (t) => t.replace(/[^.]*(brule|brûle|compense|rattrape)[^.]*(demain|calories)[^.]*\./gi, ' Demain, on reprend simplement le rythme normal.'),
  },
  {
    id: 'no_emoji',
    test: /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u,
    fix: (t) => t.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, ''),
  },
];

export function applyOutputGuardrails(text: string): { text: string; triggered: string[] } {
  let out = text;
  const triggered: string[] = [];
  for (const g of OUTPUT_GUARDRAILS) {
    if (g.test.test(out)) {
      triggered.push(g.id);
      out = g.fix(out);
    }
  }
  return { text: out.trim(), triggered };
}

export async function answerQuestion(question: string, state: UserState, computed: ComputedState, opts: OrchestratorOptions = {}): Promise<CoachAnswer> {
  const intent = classifyIntent(question);
  const rules = rulesCoach(question, state, computed);

  // Sécurité et vision : toujours déterministes (pas de place pour l'improvisation)
  if (intent === 'safety' || intent === 'vision' || !opts.provider) {
    return { text: rules.text, intent, source: 'rules', evidenceIds: rules.evidenceIds, guardrailsTriggered: [] };
  }

  const pack = buildContextPack(state, computed);
  const system = `${COACH_SYSTEM_PROMPT}\n\nRéponse du moteur déterministe pour cette question (base factuelle à reformuler, enrichir ou nuancer, jamais à contredire sur les chiffres) :\n${rules.text}\n\nCONTEXTE JSON :\n${JSON.stringify(pack)}`;
  const messages: ChatMessage[] = [...(opts.history ?? []).slice(-8), { role: 'user', content: question }];

  const providers = [opts.provider, opts.fallback].filter((p): p is NonNullable<typeof p> => Boolean(p));
  for (const provider of providers) {
    try {
      const raw = await provider.complete(system, messages, { maxTokens: 600, temperature: 0.4 });
      const { text, triggered } = applyOutputGuardrails(raw);
      if (text.length > 20) return { text, intent, source: 'llm', providerId: provider.id, evidenceIds: rules.evidenceIds, guardrailsTriggered: triggered };
    } catch {
      // on passe au fournisseur suivant, puis au coach à règles
    }
  }
  return { text: rules.text, intent, source: 'rules', evidenceIds: rules.evidenceIds, guardrailsTriggered: [] };
}

/** Construit les fournisseurs à partir des variables d'environnement (serveur uniquement). */
export function providersFromEnv(env: Record<string, string | undefined>): { provider: LLMProvider | null; fallback: LLMProvider | null } {
  const list: LLMProvider[] = [];
  if (env.ANTHROPIC_API_KEY) list.push(anthropicProvider(env.ANTHROPIC_API_KEY, env.ANTHROPIC_MODEL ?? 'claude-sonnet-5-5'));
  if (env.OPENAI_API_KEY) list.push(openAICompatibleProvider(env.OPENAI_API_KEY, env.OPENAI_MODEL ?? 'gpt-4.1-mini', env.OPENAI_BASE_URL));
  if (env.OLLAMA_BASE_URL) list.push(openAICompatibleProvider('ollama', env.OLLAMA_MODEL ?? 'llama3.1', env.OLLAMA_BASE_URL));
  return { provider: list[0] ?? null, fallback: list[1] ?? null };
}
