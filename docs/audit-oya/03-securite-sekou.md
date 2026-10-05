# Audit sécurité & RGPD — Sekou (Agence Oya), 5 octobre 2026

Analyse statique, lecture seule, aucun test offensif. Périmètre : dépôt complet + en-têtes HTTP de la démo publique.

## Verdict

- **Démo statique actuelle (GitHub Pages, données locales)** : GO sous conditions — corriger les promesses de confidentialité inexactes, publier politique de confidentialité et mentions légales, traiter le stockage des photos (origine partagée github.io, quota localStorage).
- **Production avec comptes + route `/api/coach` + Supabase** : NO-GO en l'état — route API sans auth, validation, limite de taille ni rate-limit ; données de santé envoyées à un LLM tiers sans consentement spécifique ; Supabase non branché alors que l'interface l'affirme.

## Risques

### Critique
- **C1 — `/api/coach` ouverte** (`apps/web/app/api/coach/route.ts`) : aucune auth, validation, borne de taille ni rate-limit ; zod présent mais inutilisé. Correction : JWT Supabase, schéma zod strict, corps ≤ 256 Ko, rate-limit, timeout fournisseur.
- **C2 — Données de santé vers un LLM tiers sans consentement** (`packages/engine/src/coach/context.ts`, `packages/ai/src/orchestrator.ts`) : allergies, limitations, traits comportementaux, safeMode transmis ; aucun consentement vérifié. Correction : consentement séparé « coach IA tiers » vérifié côté serveur, pack minimisé, DPA, mention dans la politique.

### Élevé
- **E1 — Photos envoyées au serveur à chaque question** (`coach/page.tsx`) alors que le serveur ne s'en sert pas. Correction : état minimal sans `photos[].uri` ; en prod, recalcul côté serveur depuis la base.
- **E2 — localStorage sur origine partagée `github.io`** : tout autre projet du compte peut lire les données. Correction : domaine dédié, IndexedDB pour les photos, chiffrement client.
- **E3 — Photos en data URL non compressées, sans validation** (`body/page.tsx`) : QuotaExceeded silencieux → perte de données. Correction : type/taille vérifiés, redimension canvas ≤ 1280 px, IndexedDB, erreur de quota affichée.
- **E4 — Promesses inexactes dans l'UI** (« stockées chiffrées », « URL signées ») : aucun code Supabase/chiffrement n'existe. Correction : décrire l'implémentation réelle.
- **E5 — Pas de politique de confidentialité, mentions légales, CGU ; consentement fourre-tout obligatoire** (`onboarding/page.tsx`). Correction : pages légales, consentements art. 9 séparés, décochés, horodatés.

### Moyen
- **M1 — Injection de prompt** via champs libres et historique forgé. Correction : borner les champs, encadrer en `<user_data>`, historique reconstruit côté serveur, garde-fous de sortie renforcés.
- **M2 — Fonctions SECURITY DEFINER sans `search_path`, exécutables par tous ; export incomplet ; suppression Storage directe.** Correction : `set search_path`, `revoke/grant`, export de toutes les tables, suppression via API Storage, invalidation des sessions.
- **M3 — Bucket `body-photos` sans limite de taille ni de type.** Correction : `file_size_limit`, `allowed_mime_types`.
- **M4 — Aucune CSP ni en-têtes de sécurité.** Correction : meta CSP à court terme, en-têtes HTTP chez un hébergeur qui le permet.
- **M5 — Dépendances** : postcss ≤ 8.5.22 embarqué par next 15.5.27 (1 haute, 1 modérée, pipeline de build). Correction : plan next 16, `npm audit` + tests en CI, Dependabot.
- **M6 — Erreurs internes renvoyées au client ; pas de journalisation maîtrisée.** Correction : erreurs génériques + id de corrélation ; ne jamais journaliser `state`.

### Faible
- **F1 — CI** : permissions minimales OK ; actions épinglées par tag plutôt que SHA ; étape `gh api PUT /pages` à retirer.
- **F2 — Mobile** : AsyncStorage en clair ; `expo-secure-store` ou MMKV chiffré avant distribution.

### Conformes
Aucun secret dans le dépôt ni l'historique ; clés IA côté serveur uniquement ; RLS sur 26 tables ; bucket privé isolé par dossier ; photos et drapeaux de risque exclus du prompt ; intentions sécurité/vision forcées en déterministe ; pas de tracker ni script tiers ; HSTS.

## Checklist RGPD

| Exigence | État |
|---|---|
| Registre des traitements | À faire |
| Base légale art. 6 + art. 9 (données de santé) | À faire : consentement explicite séparé |
| Consentement photos (collecte + analyse) | Partiel |
| Information / consentement transfert LLM tiers | À faire |
| Politique de confidentialité, mentions légales, CGU | À faire |
| Exactitude des informations données | À faire (E4) |
| Minimisation | Partiel |
| Accès / portabilité | Fait en local ; SQL incomplet |
| Effacement | Fait en local ; SQL partiel |
| Durées de conservation | À faire |
| Sécurité du stockage | Partiel (E2, E3) |
| Mineurs (< 15 ans : consentement parental) | À faire |
| DPA sous-traitants, transferts hors UE | À faire |
| AIPD | Recommandée |
| HDS | À qualifier avec un juriste |
| Journalisation sans données personnelles | À faire |
| Procédure de violation (72 h) | À faire |

## Top 5 avant production
1. Verrouiller `/api/coach` (auth, zod, taille, rate-limit, état recalculé côté serveur).
2. Consentement explicite vérifié côté serveur pour le coach IA tiers, pack minimisé, DPA.
3. Pages légales, consentements art. 9 séparés, correction des promesses de l'UI.
4. Stockage des photos : validation, compression, IndexedDB, domaine dédié ; limites de bucket.
5. Durcir schéma et chaîne : `search_path`, `revoke/grant`, export complet, CSP, audit + tests en CI, plan next 16.
