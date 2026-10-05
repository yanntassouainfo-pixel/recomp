import type { ChatMessage, CompletionOptions, LLMProvider } from '../types';

/** Fournisseur compatible OpenAI (OpenAI, Mistral, Groq, Ollama…) via fetch. */
export function openAICompatibleProvider(apiKey: string, model: string, baseUrl = 'https://api.openai.com/v1'): LLMProvider {
  return {
    id: `openai-compatible:${model}`,
    async complete(system: string, messages: ChatMessage[], opts: CompletionOptions = {}) {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model,
          max_tokens: opts.maxTokens ?? 600,
          temperature: opts.temperature ?? 0.4,
          messages: [{ role: 'system', content: system }, ...messages.filter((m) => m.role !== 'system')],
        }),
      });
      if (!res.ok) throw new Error(`openai-compatible ${res.status}: ${await res.text()}`);
      const data = (await res.json()) as { choices: { message: { content: string } }[] };
      return data.choices[0]?.message.content ?? '';
    },
  };
}
