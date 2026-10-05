# RECOMP — Coach de recomposition corporelle adaptatif

> **« Devenir meilleur à poids comparable. »**
> Perdre du gras. Préserver ou construire du muscle. Améliorer la silhouette. Augmenter la vitalité. Sans transformer la vie en prison.

Ce dépôt contient l'analyse produit, l'architecture, le design system, le **Body Recomposition Engine** (TypeScript pur, testé), l'orchestrateur IA multi-fournisseurs, le schéma Supabase, l'application web Next.js et le scaffold mobile Expo.

## Démarrer

```bash
npm install
npm run dev          # http://localhost:3000
npm test             # tests du moteur (vitest)
npm run typecheck
```

Sur la page d'accueil : **« Explorer avec le profil démo »** charge le cas fondateur (homme, 1,92 m, 93 kg, 8 semaines de données simulées : poids quasi stable, tour de taille −4,5 cm, force en hausse). **« Commencer »** lance l'onboarding en 5 écrans.

Sans clé IA, le **coach à règles** répond déjà aux situations types. Pour la conversation libre, copier `apps/web/.env.example` en `.env.local` et renseigner `ANTHROPIC_API_KEY` (ou `OPENAI_API_KEY`, ou un endpoint compatible). Le LLM ne calcule jamais une cible : il reformule et explique les sorties du moteur, sous garde-fous.

## Structure

```
docs/                      analyse produit, architecture, parcours, design system, moteur, MVP
packages/engine/           BODY RECOMPOSITION ENGINE (scores, nutrition, entraînement, adaptation, coach à règles, démo)
packages/ai/               AI ORCHESTRATOR (Anthropic / OpenAI-compatible / mock, garde-fous, context pack)
packages/db/               schéma Supabase : tables, RLS, storage privé, export/suppression RGPD
apps/web/                  Next.js 15 — Home, Train, Food, Body, Coach, Bilans, Profil, onboarding
apps/mobile/               Expo Router — 5 onglets branchés sur le même moteur (scaffold, non installé)
```

## Ce que fait le moteur (résumé)

| Module | Rôle |
|---|---|
| `scores.ts` | Body Composition Score (taille, force, poids *contextualisé*, régularité, sommeil, énergie, photos), Vitality Score, Recovery Score → readiness |
| `nutrition/` | TDEE estimé, cyclage entraînement/repos, protéines 1,6–2,4 g/kg, plafond de déficit 0,7 %/sem, plan de repas concret (base internationale incl. Afrique de l'Ouest), assiette, mode simple/précis, « ton plat habituel », évaluation du jeûne |
| `training/` | Programmes 2–6 séances (full body → PPL), biais selon objectifs visuels, exclusion par limitation, double progression, deload, autorégulation par readiness, douleur → arrêt |
| `adaptation/` | Weekly Review (fonctionne / bloque / change / **ne change pas**), Plateau Detector multi-signaux, Life Mode (restaurant, voyage, Ramadan…), alertes utiles, 1–3 micro-habitudes |
| `evidence.ts` | Evidence Layer : chaque affirmation a un niveau (solide / probable / incertain / approche) et des repères bibliographiques ; fiches « approches populaires vs données » |
| `coach/` | Context pack (mémoire du coach), prompt système contraint, coach à règles déterministe |
| `report.ts` | Body Report mensuel : « voici ce que nous avons appris sur ton corps ce mois-ci » |

## Garde-fous

Pas de % de masse grasse sur photo. Pas de félicitation automatique d'une perte de poids. Pas de compensation après un repas libre. Pas de déficit pour mineur, grossesse, trouble alimentaire déclaré. Douleur inhabituelle → pas de séance sur la zone, orientation vers un professionnel. Le moteur ne révise une stratégie qu'avec ≥ 14 jours de données et ≥ 70 % d'adhérence.

## Mobile

`apps/mobile` est un scaffold Expo Router (5 onglets : Home, Train, Food, Body, Coach) qui consomme `@recomp/engine` et la démo. Il n'a pas été installé ni lancé dans cet environnement : `cd apps/mobile && npm install && npx expo start`.

## Avertissement

RECOMP n'est pas un dispositif médical. Les valeurs nutritionnelles sont approximatives, les repères bibliographiques sont à vérifier et à maintenir. Voir `docs/00-analyse-produit.md` pour les risques et leurs mitigations.
