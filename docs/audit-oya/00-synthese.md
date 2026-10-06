# Audit Agence Oya — synthèse et plan d'action (5 octobre 2026)

Quatre auditeurs, lecture seule, sur le commit `c268e42` et le site en ligne : **Moussa** (technique & UX), **Sekou** (sécurité & RGPD), **Aicha** (marque & conversion), **Adisa** (benchmark marché). Rapports détaillés dans ce dossier.

## Verdict consolidé

Le socle est bon : moteur TypeScript pur et testé, garde-fous produit réellement codés, positionnement rare et juste (« devenir meilleur à poids comparable »), différenciateurs réels sur le marché (score composite à la place du poids, Evidence Layer, Life Mode, nutrition ouest-africaine, « savoir ne rien changer »). Mais le livré était une démo desktop convaincante, pas une application quotidienne ni un produit prêt pour une bêta : navigation mobile amputée, photos qui saturent le stockage, bug de fuseau horaire, plan de repas non crédible, aucune page légale, API ouverte, landing sans preuve ni cible.

## Corrigé dans cette itération (statut au 5 octobre, soir)

| Source | Point | Statut |
|---|---|---|
| Moussa B1 | Profil, Bilans, Planning, Coach accessibles sur mobile via l'onglet « Plus » | Fait |
| Moussa B2 / Sekou E3 | Photos : type et taille vérifiés, redimension 1280 px JPEG, erreur de quota affichée | Fait (IndexedDB : à faire) |
| Moussa M1 | Fuseau horaire : helpers locaux remplacés par ceux du moteur ; tests exécutés avec `TZ=Europe/Paris` | Fait |
| Moussa M2 | Force : une seule fonction `strengthDelta28d` pour score, KPI et revue ; unité de temps affichée | Fait |
| Moussa M3 | Plan de repas : bornes de plausibilité par aliment et par rôle, seconde source protéique si plafond ; test sur 4 profils × 2 jours × 7 variantes | Fait |
| Moussa M4 / Sekou C1, E1, M6 | API : validation zod, corps ≤ 256 Ko, photos jamais envoyées ni acceptées, erreurs génériques | Fait (auth, rate-limit, état relu côté serveur : production) |
| Moussa M5 | Mode statique : coach déterministe direct, étiquette « démo », plus de POST en 405 | Fait |
| Moussa M6 | Onboarding : bornes d'âge, taille, poids, séances, durée ; message inline | Fait |
| Moussa M7 | Brouillon de séance persistant ; substitution enregistrée sous le bon exercice | Fait |
| Moussa M8 | Contraste `--ink-3` relevé (clair et sombre) | Fait |
| Moussa M9 | Modales : rôle dialog, Échap, focus initial, défilement verrouillé ; focus visible | Fait |
| Moussa m1, m2, m3, m4, m5 | CI avec tests et audit ; dépendances inutilisées retirées ; `error.tsx`, `not-found.tsx` ; textes FR ; labels ; theme-color | Fait |
| Moussa écarts 3, 4 | Profil progressif (zones sensibles, aliments évités, traits) ; analyse IA des photos livrée (route `/api/vision`, consentement explicite, garde-fous) | Fait |
| Sekou E4 / Aicha H4 | Promesses de l'UI corrigées ; pages Confidentialité et Mentions légales ; liens en pied de page et dans l'onboarding | Fait (responsable du traitement à compléter) |
| Sekou E5 | Consentement données de santé séparé, horodaté | Fait |
| Sekou M2, M3 | SQL : `search_path`, `revoke/grant`, export complet, limites de bucket | Fait |
| Sekou F1 | Étape `gh api PUT` retirée ; `npm test` et `npm audit` en CI | Fait |
| Aicha H1 | Onboarding → dashboard testé de bout en bout sur l'export statique : atterrit sur le profil créé | Vérifié, non reproduit |
| Aicha H2, H3, H5, M1, M3, M4, M6 | Landing : preuve (score + Evidence Layer), « Tu peux garder ton mafé », « Ta vie ne s'adapte pas au plan », FAQ 7 questions, CTA final, trajectoire féminine, cible nommée, liste d'attente bêta | Fait |
| Aicha B2, B3, M5 | Navigation mobile en français ; favicon ; Open Graph ; message sous le bouton de l'onboarding | Fait |
| Brief utilisateur | Programme périodisé 12 semaines par objectif, calendrier mensuel, planning hebdo, jalons | Fait |

## Reste à faire (ordre recommandé)

1. **Avant tout trafic réel** : compléter le responsable du traitement dans les pages légales ; brancher `NEXT_PUBLIC_WAITLIST_URL` (Formspree, n8n…) et `NEXT_PUBLIC_CONTACT_EMAIL` ; domaine dédié pour sortir de l'origine partagée `github.io` (Sekou E2).
2. **Avant comptes réels** (Sekou top 5) : auth Supabase sur `/api/coach`, état relu côté serveur, rate-limit, consentement « coach IA tiers » vérifié côté serveur, DPA fournisseurs, AIPD, photos en IndexedDB puis Storage privé.
3. **Produit** (Moussa écarts) : log de séance hors-ligne (service worker), notifications de rappel, budget d'adhérence par mode, `protocolOk` pondérant les mesures, Expo installé et testé sur téléphone.
4. **Marché** (Adisa) : positionnement « le coach qui ne te pèse pas », prix 69–79 €/an à arbitrer avec Kwame, lancement niche diaspora FR / Afrique de l'Ouest avant Ramadan 2027, 50 cas « poids stable, taille −4 cm » comme preuve sociale, photo-logging via API tierce.
5. **Dette** : migration Next 16 (postcss), sparklines SVG sans Recharts, ESLint.
