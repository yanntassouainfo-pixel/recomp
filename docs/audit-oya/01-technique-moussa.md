# Audit technique & UX — Moussa (Agence Oya), 5 octobre 2026

Périmètre : commit `c268e42` + site en ligne, desktop et mobile, thèmes clair et sombre. Typecheck OK, 32 tests moteur OK, aucune erreur console.

## Verdict
Socle sain : moteur TypeScript pur et testé, UI client cohérente, thème sans flash, bundle léger. Mais le livré est une démo desktop convaincante, pas encore une application quotidienne : navigation mobile amputée, photos qui feront sauter localStorage, bug de fuseau horaire cassant Life Mode en France, plan de repas « précis » non crédible, messages contradictoires sur la force.

## Points forts
Séparation données / logique / affichage ; garde-fous produit réellement codés et testés ; thème clair/sombre sans flash ; repli déterministe du coach ; export/suppression dès la démo.

## Problèmes
### Bloquant
- **B1** — Profil et Bilans inaccessibles sur mobile (barre basse à 5 onglets).
- **B2** — Photos base64 dans localStorage : QuotaExceeded silencieux qui bloque toutes les sauvegardes.
### Majeur
- **M1** — Fuseau horaire : helpers locaux `toISOString()` reculent d'un jour à l'est d'UTC ; Life Mode d'un jour ne s'active jamais en France.
- **M2** — Trois calculs différents de la force sur le même écran (titre, KPI, bilan).
- **M3** — Plan de repas précis non crédible (330 g d'œufs, 520 g de riz) : pas de bornes par aliment.
- **M4** — Le chat envoie l'état complet (photos incluses) ; API sans validation, taille, auth ni rate-limit.
- **M5** — Sur Pages, chaque question fait un POST en 405 puis « hors-ligne » : détecter le mode statique.
- **M6** — Onboarding sans validation (poids 0 accepté) ; brouillon perdu au refresh.
- **M7** — Log de séance perdu à la navigation ; substitution d'exercice enregistrée sous le mauvais id.
- **M8** — Contraste `--ink-3` insuffisant (2,9:1 clair, 3,95:1 sombre).
- **M9** — Modales non accessibles (pas de rôle dialog, Échap, focus) ; `outline: none` sur les inputs.
### Mineur
- **m1** — CI sans test ni typecheck ; `rm -rf api` pour l'export.
- **m2** — Dépendances déclarées jamais importées ; tsbuildinfo versionné ; pas d'ESLint.
- **m3** — Pas d'`error.tsx` / `not-found.tsx`.
- **m4** — « Your Body Report » en anglais ; enum brut dans Profil ; hiérarchie H1→H3→H2 ; selects sans label ; titres tronqués.
- **m5** — `theme-color` figé en clair.
- **m6** — Recharts chargé pour 3 sparklines.

## Écarts brief / livré
1. Mobile = usage quotidien, mais 2 écrans sur 7 inaccessibles ; scaffold Expo jamais lancé.
2. Pas de mode hors-ligne pour le log de séance.
3. Progressive profiling inexistant : limitations, aliments évités, traits restent vides à vie.
4. Consentement « analyse IA des photos » sans fonctionnalité derrière.
5. Supabase : schéma présent, zéro code client, promesse affichée dans Profil.
6. Budget d'adhérence absent du moteur.
7. `protocolOk` n'influence aucun calcul.
8. Notifications : alertes textuelles seulement.

## Top 5
1. Profil et Bilans sur mobile. 2. Dates : helpers du moteur + test `TZ=Europe/Paris`. 3. Photos : redimension + IndexedDB + erreur quota. 4. Unifier la force, borner le plan de repas. 5. CI test + typecheck, zod + payload réduit + rate-limit, `error.tsx`, nettoyage des dépendances.
