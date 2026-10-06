import { describe, expect, it } from 'vitest';
import { analyzePhotos, mockProvider, parseVisionResponse, buildVisionPrompt } from '../src/index';

const GOOD = JSON.stringify({ refused: false, quality: { lighting: 'good', framing: 'ok', pose: 'good', comparable: true, notes: ['Lumière de fenêtre, ombres douces.'] }, observations: [
  { area: 'posture', note: 'Épaules légèrement enroulées vers l’avant, tête un peu projetée.', confidence: 'medium' },
  { area: 'abdomen', note: 'Profil abdominal arrondi dans la partie basse, tonique au-dessus du nombril.', confidence: 'high' },
  { area: 'shoulders', note: 'Épaules visiblement plus larges que la taille, relief des deltoïdes lisible.', confidence: 'high' },
], comparison: { summary: 'La taille paraît plus marquée que sur la photo précédente.', changes: [{ area: 'waist', note: 'Contour de la taille plus dessiné.', confidence: 'medium' }], caveats: ['Lumière plus latérale sur la seconde photo, ce qui accentue les reliefs.'] }, limits: ['Je ne peux pas estimer la masse grasse à partir d’une photo.'], nextPhotoTips: ['Même distance, repère au sol.'], suggestions: ['Si le tour de taille confirme la tendance, garder le plan.'], safetyFlags: [] });

describe('vision', () => {
  it('parse et valide une réponse correcte', () => {
    const r = parseVisionResponse('Voici :\n' + GOOD, 'mock');
    expect(r.ok).toBe(true);
    expect(r.analysis!.observations.length).toBe(3);
    expect(r.analysis!.comparison!.changes[0]!.area).toBe('waist');
    expect(r.analysis!.quality.lighting).toBe('good');
  });
  it('supprime tout pourcentage de masse grasse ou poids estimé', () => {
    const bad = GOOD.replace('Profil abdominal arrondi', 'Environ 22 % de masse grasse, profil abdominal arrondi').replace('Même distance, repère au sol.', 'Tu fais environ 95 kg. Même distance.');
    const r = parseVisionResponse(bad, 'mock');
    expect(r.ok).toBe(true);
    expect(r.guardrailsTriggered).toContain('no_bodyfat_percent');
    expect(r.guardrailsTriggered).toContain('no_weight_guess');
    expect(JSON.stringify(r.analysis)).not.toMatch(/22\s?%/);
    expect(JSON.stringify(r.analysis)).not.toMatch(/95 kg/);
  });
  it('refus explicite et réponses invalides', () => {
    expect(parseVisionResponse(JSON.stringify({ refused: true, refusalReason: 'mineur' }), 'mock').refused).toBe(true);
    expect(parseVisionResponse('pas de json', 'mock').ok).toBe(false);
    expect(parseVisionResponse(JSON.stringify({ observations: [] }), 'mock').ok).toBe(false);
  });
  it('analyzePhotos passe par le fournisseur vision et construit le prompt avec le contexte', async () => {
    const input = { current: { data: 'AAAA', mediaType: 'image/jpeg' as const, view: 'front' as const, date: '2026-10-06' }, previous: { data: 'BBBB', mediaType: 'image/jpeg' as const, view: 'front' as const, date: '2026-09-08' }, profile: { sex: 'male', age: 36, heightCm: 192, primaryGoal: 'recomposition', visualGoals: ['defined'], fatStorage: ['abdomen'] }, context: { waistDeltaCm: -2.1, weightDeltaKg: -0.4, strengthDeltaPct: 3, weeksBetween: 4 } };
    expect(buildVisionPrompt(input)).toMatch(/-2.1 cm/);
    const r = await analyzePhotos(mockProvider('x', GOOD), input);
    expect(r.ok).toBe(true);
    const noVision = { id: 'nv', async complete() { return ''; } };
    expect((await analyzePhotos(noVision, input)).error).toBe('provider_no_vision');
  });
});
