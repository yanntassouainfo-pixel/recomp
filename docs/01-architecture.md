# 01 — Architecture technique

## Vue d'ensemble

```
apps/
  web/        Next.js 15 (App Router, React 19, Tailwind v4) — version analytique
  mobile/     Expo (React Native, expo-router) — usage quotidien, 5 onglets
packages/
  engine/     BODY RECOMPOSITION ENGINE — TypeScript pur, zéro dépendance, testé (vitest)
  ai/         AI ORCHESTRATOR — routage multi-fournisseurs, coach à règles de repli
  db/         Schéma PostgreSQL (Supabase) : migrations SQL, RLS, storage, fonctions
```

Principe fondamental : **toute la logique métier est dans `packages/engine`**. Web et mobile sont des rendus. L'IA générative ne calcule jamais une cible ; elle explique, reformule, converse.

## Flux de données

```
Inputs utilisateur ──► Repository (Local | Supabase) ──► Engine.compute(state)
                                                            │
                     ┌──────────────────────────────────────┤
                     ▼                                      ▼
            Scores (BCS, Vitality, Recovery)       Plans (nutrition du jour, séance du jour)
                     │                                      │
                     ▼                                      ▼
            Weekly Review / Monthly Report          Daily Brief (3 priorités)
                     │
                     ▼
            Context Pack ──► AI Orchestrator ──► Coach (LLM contraint) ou Rules Coach
```

## Couche données

- **Repository pattern** : une interface `Repository` (profil, mesures, check-ins, séances, logs, conversations).
  - `LocalRepository` : localStorage/AsyncStorage, utilisé pour la démo et le mode hors-ligne.
  - `SupabaseRepository` : PostgreSQL + RLS, auth Supabase, storage privé pour les photos.
- **Synchronisation** : write-through local → file d'attente → Supabase (mobile hors-ligne).

## Modèle de données (résumé — voir `packages/db/supabase/migrations`)

`profiles`, `goals`, `measurements`, `body_photos`, `nutrition_profiles`, `foods`, `meals`, `meal_logs`, `exercises`, `workouts`, `workout_days`, `workout_sessions`, `performance_logs`, `sleep_logs`, `recovery_logs`, `daily_checkins`, `weekly_reviews`, `monthly_reports`, `ai_conversations`, `ai_messages`, `ai_recommendations`, `habits`, `habit_logs`, `life_events`, `notifications`, `consents`, `integrations`.

Toutes les tables utilisateur portent `user_id uuid references auth.users` + RLS « owner only ».

## AI Orchestrator

```
request ──► classify(intent) ──► route
                                  ├─ conversation  → LLM (Anthropic | OpenAI | local) + context pack
                                  ├─ vision        → modèle vision (observations prudentes uniquement)
                                  ├─ nutrition     → engine.nutrition (déterministe) puis LLM pour la mise en mots
                                  ├─ training      → engine.training (déterministe)
                                  ├─ analysis      → engine.review / plateau / scores
                                  └─ fallback      → RulesCoach (sans réseau, sans clé)
```

- Les fournisseurs implémentent `LLMProvider { complete(messages, opts) }`.
- Le **context pack** est un JSON compact (profil, 14 derniers jours, scores, plan du jour, décisions passées, niveaux de preuve mobilisés). Il constitue la **mémoire du coach** : l'utilisateur ne re-raconte jamais son histoire.
- **Garde-fous** appliqués avant et après le LLM : détection de signaux à risque, interdiction de chiffres de masse grasse sur photo, interdiction de prescription médicale.

## Intégrations (architecture prête, non implémentées en V1)

Table `integrations(provider, scopes, tokens chiffrés, last_sync)` + `health_samples(type, value, unit, source, start, end)` normalisée. Adaptateurs prévus : Apple Health, Health Connect, Garmin, Fitbit, Oura, Withings. L'engine consomme `health_samples` comme des check-ins enrichis (pas de couplage au fournisseur).

## Sécurité & données

- Auth Supabase (email + OTP, OAuth), MFA possible.
- RLS sur toutes les tables ; bucket `body-photos` privé, URL signées courte durée.
- Chiffrement au repos (Postgres/Storage) ; chiffrement côté client optionnel des photos (clé dérivée du compte) prévu V2.
- `consents` : analyse IA des photos, amélioration produit, notifications — chacun révocable.
- Export complet (`export_user_data()` → JSON) et suppression définitive (`delete_user_data()`) en une action.
- Minimisation : pas de nom requis, pas de localisation, pas de contacts.

## Choix techniques

| Sujet | Choix | Pourquoi |
|---|---|---|
| Monorepo | npm workspaces | zéro outillage supplémentaire, suffisant pour 2 apps + 3 packages |
| Web | Next.js 15 App Router | SSR pour les rapports, API routes pour l'orchestrateur |
| Styles | Tailwind v4 + tokens CSS | design system en variables, dark mode natif |
| Graphiques | Recharts | léger, suffisant pour sparklines et tendances |
| État | Zustand + persist | simple, fonctionne hors-ligne, swap vers Supabase sans toucher l'UI |
| Mobile | Expo Router | même engine TS, navigation par onglets |
| Tests | Vitest sur l'engine | la complexité est dans le moteur, c'est lui qu'on teste |
