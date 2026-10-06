export type Role = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  role: Role;
  content: string;
}

export interface CompletionOptions {
  maxTokens?: number;
  temperature?: number;
}

export interface VisionImage {
  /** base64 sans préfixe data: */
  data: string;
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp';
  label?: string;
}

export interface LLMProvider {
  readonly id: string;
  complete(system: string, messages: ChatMessage[], opts?: CompletionOptions): Promise<string>;
  /** complétion multimodale (images + texte) ; absent si le fournisseur ne gère pas la vision */
  completeVision?(system: string, images: VisionImage[], prompt: string, opts?: CompletionOptions): Promise<string>;
}

export type Intent = 'conversation' | 'nutrition' | 'training' | 'analysis' | 'vision' | 'safety';

export interface OrchestratorOptions {
  /** fournisseur principal pour la conversation ; si absent → coach à règles */
  provider?: LLMProvider | null;
  /** fournisseur secondaire (repli) */
  fallback?: LLMProvider | null;
  /** historique court de la conversation */
  history?: ChatMessage[];
}

export interface CoachAnswer {
  text: string;
  intent: Intent;
  source: 'llm' | 'rules';
  providerId?: string;
  evidenceIds: string[];
  guardrailsTriggered: string[];
}
