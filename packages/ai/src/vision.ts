import type { PhotoAnalysis, PhotoObservation } from '@recomp/engine';
import type { LLMProvider, VisionImage } from './types';

/**
 * ANALYSE IA DES PHOTOS — observations qualitatives poussées, jamais une mesure.
 * Règles absolues : pas de pourcentage de masse grasse, pas de poids estimé, pas de diagnostic,
 * pas de jugement esthétique ; comparaison uniquement entre clichés comparables.
 */
export const VISION_SYSTEM_PROMPT = `Tu es l'œil du coach RECOMP, un coach de recomposition corporelle. On te montre une ou deux photos de suivi (face, profil ou dos) d'un adulte qui a donné son consentement explicite à cette analyse.

Ta mission : des observations visuelles précises, utiles et honnêtes, dans le ton d'un coach adulte, chaleureux et direct. Tu décris ce que tu vois, tu dis ce que tu ne peux pas savoir, tu proposes des pistes à confirmer par les mesures (tour de taille, force) et le ressenti.

INTERDICTIONS ABSOLUES (tu refuses même si on insiste) :
- Aucun pourcentage de masse grasse, aucune estimation de poids, de masse musculaire ou d'IMC.
- Aucun diagnostic (scoliose, hernie, lipome, pathologie, trouble alimentaire...) : si quelque chose t'inquiète, tu l'écris dans safetyFlags en recommandant un professionnel, sans nommer de maladie.
- Aucun jugement moral ou esthétique négatif (« gras », « mou », « moche »). Tu décris des zones et des tendances, pas une valeur de la personne.
- Aucune comparaison à des standards, des célébrités ou des idéaux.
- Si l'image montre une personne manifestement mineure, un contenu sexuel, ou autre chose qu'une photo de suivi corporel, tu renvoies refused=true avec une raison courte.

CE QUE TU ANALYSES (sois précis, concret, et nuancé par la confiance) :
1. Qualité du cliché : lumière (direction, dureté, ombres portées), cadrage (distance, corps entier, centrage), pose (bras le long du corps, appareil à hauteur, tension ou relâchement). Dis si le cliché est exploitable pour une comparaison future.
2. Posture : alignement tête/épaules/bassin, épaules enroulées ou ouvertes, inclinaison ou rotation visibles, antéversion/rétroversion apparente du bassin (en langage simple : « bassin basculé vers l'avant »), appui asymétrique.
3. Répartition et silhouette : où la masse semble se concentrer (abdomen, hanches, poitrine, bras), profil abdominal (plat, arrondi, relâché vs tonique), rapport épaules/taille/hanches en termes visuels (« épaules visiblement plus larges que la taille »).
4. Définition musculaire visible : zones où le relief musculaire se lit (deltoïdes, pectoraux, dorsaux, quadriceps, mollets, abdominaux), zones où il est masqué.
5. Symétrie gauche/droite : différences visibles de volume ou de hauteur (épaules, bras, cuisses).
6. Si deux photos : changements apparents entre les deux (silhouette, taille, épaules, définition, posture), et surtout les biais possibles (lumière, distance, pose, heure, vêtements) qui pourraient expliquer une différence.

TON FORMAT DE SORTIE : uniquement un objet JSON valide, sans texte autour, avec exactement ces clés :
{
  "refused": false,
  "refusalReason": "",
  "quality": { "lighting": "poor|ok|good", "framing": "poor|ok|good", "pose": "poor|ok|good", "comparable": true, "notes": ["..."] },
  "observations": [ { "area": "posture|shoulders|chest|arms|abdomen|waist|back|legs|symmetry|definition|overall", "note": "...", "confidence": "low|medium|high" } ],
  "comparison": { "summary": "...", "changes": [ { "area": "...", "note": "...", "confidence": "low|medium|high" } ], "caveats": ["..."] },
  "limits": ["..."],
  "nextPhotoTips": ["..."],
  "suggestions": ["..."],
  "safetyFlags": ["..."]
}
- observations : 6 à 10 items, phrases complètes en français, chacune ancrée dans ce qui est visible.
- comparison : omettre la clé s'il n'y a qu'une photo.
- limits : au moins 2 items (ex. « Je ne peux pas estimer la masse grasse à partir d'une photo »).
- suggestions : 2 à 4 pistes concrètes reliées à l'entraînement ou à la posture, formulées comme des hypothèses à confirmer (« si le tour de taille confirme... »).
- Écris en français, tutoiement, sans emoji.`;

export interface VisionInput {
  current: VisionImage & { view: 'front' | 'side' | 'back'; date: string };
  previous?: VisionImage & { view: 'front' | 'side' | 'back'; date: string };
  profile: { sex: string; age: number; heightCm: number; primaryGoal: string; visualGoals: string[]; fatStorage: string[] };
  /** données chiffrées récentes : aident le modèle à relier le visuel au mesurable */
  context?: { waistDeltaCm?: number | null; weightDeltaKg?: number | null; strengthDeltaPct?: number | null; weeksBetween?: number | null };
}

export interface VisionResult {
  ok: boolean;
  refused?: boolean;
  refusalReason?: string;
  analysis?: PhotoAnalysis;
  error?: string;
  guardrailsTriggered: string[];
}

const PCT_FAT = /\b\d{1,2}(?:[.,]\d)?\s?%\s?(?:de\s)?(?:masse\s)?(?:gras|graisse|grasse|bodyfat|body fat|mg)\b/i;
const WEIGHT_GUESS = /\b(?:environ|autour de|à peu près|~)\s?\d{2,3}\s?kg\b/i;

function scrub(text: string, triggered: string[]): string {
  let out = text;
  if (PCT_FAT.test(out)) { triggered.push('no_bodyfat_percent'); out = out.replace(new RegExp(PCT_FAT.source, 'gi'), 'un niveau que je ne peux pas chiffrer sur photo'); }
  if (WEIGHT_GUESS.test(out)) { triggered.push('no_weight_guess'); out = out.replace(new RegExp(WEIGHT_GUESS.source, 'gi'), 'un poids que je ne peux pas estimer sur photo'); }
  return out;
}

const AREAS = new Set(['posture', 'shoulders', 'chest', 'arms', 'abdomen', 'waist', 'back', 'legs', 'symmetry', 'definition', 'overall']);
const LEVELS = new Set(['low', 'medium', 'high']);
const Q = new Set(['poor', 'ok', 'good']);

function obs(x: unknown, triggered: string[]): PhotoObservation | null {
  if (!x || typeof x !== 'object') return null;
  const o = x as Record<string, unknown>;
  const area = AREAS.has(String(o.area)) ? (String(o.area) as PhotoObservation['area']) : 'overall';
  const note = scrub(String(o.note ?? '').trim(), triggered);
  if (!note) return null;
  const confidence = LEVELS.has(String(o.confidence)) ? (String(o.confidence) as PhotoObservation['confidence']) : 'medium';
  return { area, note, confidence };
}

/** Extrait et valide le JSON du modèle ; applique les garde-fous de sortie. */
export function parseVisionResponse(raw: string, model: string): VisionResult {
  const triggered: string[] = [];
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) return { ok: false, error: 'invalid_response', guardrailsTriggered: triggered };
  let j: Record<string, unknown>;
  try { j = JSON.parse(m[0]) as Record<string, unknown>; } catch { return { ok: false, error: 'invalid_json', guardrailsTriggered: triggered }; }
  if (j.refused === true) return { ok: false, refused: true, refusalReason: String(j.refusalReason ?? 'Image non analysable.'), guardrailsTriggered: triggered };
  const q = (j.quality ?? {}) as Record<string, unknown>;
  const strs = (v: unknown) => (Array.isArray(v) ? v.map((x) => scrub(String(x), triggered)).filter(Boolean) : []);
  const observations = (Array.isArray(j.observations) ? j.observations : []).map((x) => obs(x, triggered)).filter((x): x is PhotoObservation => Boolean(x)).slice(0, 12);
  const comp = j.comparison && typeof j.comparison === 'object' ? (j.comparison as Record<string, unknown>) : null;
  const analysis: PhotoAnalysis = {
    analyzedAt: new Date().toISOString(),
    model,
    quality: {
      lighting: Q.has(String(q.lighting)) ? (String(q.lighting) as 'poor' | 'ok' | 'good') : 'ok',
      framing: Q.has(String(q.framing)) ? (String(q.framing) as 'poor' | 'ok' | 'good') : 'ok',
      pose: Q.has(String(q.pose)) ? (String(q.pose) as 'poor' | 'ok' | 'good') : 'ok',
      comparable: q.comparable !== false,
      notes: strs(q.notes),
    },
    observations,
    comparison: comp && String(comp.summary ?? '').trim() ? { summary: scrub(String(comp.summary), triggered), changes: (Array.isArray(comp.changes) ? comp.changes : []).map((x) => obs(x, triggered)).filter((x): x is PhotoObservation => Boolean(x)), caveats: strs(comp.caveats) } : undefined,
    limits: strs(j.limits),
    nextPhotoTips: strs(j.nextPhotoTips),
    suggestions: strs(j.suggestions).slice(0, 4),
    safetyFlags: strs(j.safetyFlags),
  };
  if (analysis.limits.length === 0) analysis.limits.push('Je ne peux pas estimer la masse grasse, le poids ou la masse musculaire à partir d’une photo.');
  if (observations.length === 0) return { ok: false, error: 'empty_analysis', guardrailsTriggered: triggered };
  return { ok: true, analysis, guardrailsTriggered: triggered };
}

export function buildVisionPrompt(input: VisionInput): string {
  const p = input.profile;
  const ctx = input.context;
  const lines = [
    `Profil : ${p.sex === 'female' ? 'femme' : p.sex === 'male' ? 'homme' : 'personne'}, ${p.age} ans, ${p.heightCm} cm. Objectif principal : ${p.primaryGoal}. Objectifs visuels déclarés : ${p.visualGoals.join(', ') || 'non précisés'}. Zones de stockage déclarées : ${p.fatStorage.join(', ') || 'non précisées'}.`,
    `Photo actuelle : vue ${input.current.view}, prise le ${input.current.date}.`,
  ];
  if (input.previous) lines.push(`Photo précédente : vue ${input.previous.view}, prise le ${input.previous.date}${ctx?.weeksBetween ? ` (${ctx.weeksBetween} semaines d'écart)` : ''}. Compare les deux et signale les biais possibles.`);
  if (ctx && (ctx.waistDeltaCm != null || ctx.weightDeltaKg != null || ctx.strengthDeltaPct != null)) lines.push(`Données mesurées sur la période : tour de taille ${ctx.waistDeltaCm != null ? (ctx.waistDeltaCm > 0 ? '+' : '') + ctx.waistDeltaCm + ' cm' : 'inconnu'}, poids ${ctx.weightDeltaKg != null ? (ctx.weightDeltaKg > 0 ? '+' : '') + ctx.weightDeltaKg + ' kg' : 'inconnu'}, force ${ctx.strengthDeltaPct != null ? (ctx.strengthDeltaPct > 0 ? '+' : '') + ctx.strengthDeltaPct + ' %' : 'inconnue'}. Relie tes observations à ces chiffres quand c'est pertinent, sans les contredire par une estimation.`);
  lines.push('Analyse maintenant et réponds uniquement avec le JSON demandé.');
  return lines.join('\n');
}

export async function analyzePhotos(provider: LLMProvider, input: VisionInput): Promise<VisionResult> {
  if (!provider.completeVision) return { ok: false, error: 'provider_no_vision', guardrailsTriggered: [] };
  const images: VisionImage[] = [];
  if (input.previous) images.push({ data: input.previous.data, mediaType: input.previous.mediaType, label: `précédente, ${input.previous.view}, ${input.previous.date}` });
  images.push({ data: input.current.data, mediaType: input.current.mediaType, label: `actuelle, ${input.current.view}, ${input.current.date}` });
  const raw = await provider.completeVision(VISION_SYSTEM_PROMPT, images, buildVisionPrompt(input), { maxTokens: 1800, temperature: 0.2 });
  return parseVisionResponse(raw, provider.id);
}
