import type { ChatMessage, CompletionOptions, LLMProvider } from '../types';

/** Fournisseur Anthropic via fetch (aucune dépendance SDK). */
export function anthropicProvider(apiKey: string, model = 'claude-sonnet-5-5'): LLMProvider {
  return {
    id: `anthropic:${model}`,
    async complete(system: string, messages: ChatMessage[], opts: CompletionOptions = {}) {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({
          model,
          system,
          max_tokens: opts.maxTokens ?? 600,
          temperature: opts.temperature ?? 0.4,
          messages: messages.filter((m) => m.role !== 'system').map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      if (!res.ok) throw new Error(`anthropic ${res.status}: ${await res.text()}`);
      const data = (await res.json()) as { content: { type: string; text?: string }[] };
      return data.content.filter((c) => c.type === 'text').map((c) => c.text ?? '').join('');
    },
  };
}
