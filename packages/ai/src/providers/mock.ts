import type { LLMProvider } from '../types';

/** Fournisseur de test : renvoie un texte fixe. */
export function mockProvider(text = 'Réponse simulée.', visionText?: string): LLMProvider {
  return { id: 'mock', async complete() { return text; }, async completeVision() { return visionText ?? text; } };
}
