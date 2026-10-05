import type { LLMProvider } from '../types';

/** Fournisseur de test : renvoie un texte fixe. */
export function mockProvider(text = 'Réponse simulée.'): LLMProvider {
  return { id: 'mock', async complete() { return text; } };
}
