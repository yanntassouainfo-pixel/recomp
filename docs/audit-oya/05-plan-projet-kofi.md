# « Qu'est-ce qu'on peut encore améliorer ? » — Plan de projet Oya (Kofi, 5 octobre 2026)

## 1. État des lieux
- Livré et solide : moteur TypeScript pur, 36 tests, typecheck OK ; les 30 points des 4 audits corrigés.
- Fragile n° 1 : le site public tourne encore sur l'ancien commit (déploiement annulé par GitHub après file d'attente). Tout ce qui est corrigé n'est pas encore en ligne.
- En cours : split adaptatif (niveau × objectif × préférence), objectif de poids, parcours perte de poids.
- Pas prêt pour des comptes réels : API sans auth ni rate-limit, Supabase non branché, consentement IA tiers non vérifié serveur.
- Pas prêt pour du trafic : liste d'attente et e-mail de contact vides, responsable du traitement absent, pas de domaine dédié.

## 2. Backlog MoSCoW (bêta privée de 50 testeurs)
Effort : S ≤ 1 j · M 2–4 j · L ≥ 5 j.

### Must
| # | Amélioration | Effort | Dép. | Resp. |
|---|---|---|---|---|
| M1 | Relancer le déploiement, vérifier en prod, contrôle post-déploiement (curl de 3 pages) | S | — | Moussa |
| M2 | Split adaptatif + test sur 6 profils ; sélecteur visible | M | — | Moussa |
| M3 | Objectif de poids facultatif + parcours perte de poids (déficit ≤ 0,7 %/sem, garde-fous TCA, ton non culpabilisant, poids jamais 1er chiffre) | M | M2 | Moussa + Aicha |
| M4 | Liste d'attente branchée + e-mail contact + responsable du traitement | S | D1 | Moussa + Sekou |
| M5 | Vercel : clé en variable d'environnement, `/api/coach` avec auth Supabase, rate-limit, état relu serveur, consentement IA vérifié | L | D1 | Moussa + Sekou |
| M6 | Supabase branché (magic link, RLS, sync) + domaine dédié | L | M5 | Moussa |
| M7 | Photos en IndexedDB puis Storage privé | M | M6 | Moussa |
| M8 | Test E2E Playwright « Commencer → plan » en CI | M | M1 | Moussa |
| M9 | Mini-analytics sans tracker tiers (onboarding fini, check-in, séance, J7, J14) | S | M6 | Moussa + Aicha |
| M10 | Kit bêta : charte testeur, questionnaires J0/J14/J28, canal WhatsApp/Discord, NPS | M | M4 | Ayo + Amara |

### Should
S1 PWA + log de séance hors-ligne · S2 rappels web (check-in, mesure du dimanche, photos J28) · S3 `protocolOk` pondérant les mesures + budget d'adhérence par mode · S4 journal de décisions du coach visible · S5 harmoniser la démo · S6 DPA, registre, AIPD, procédure 72 h (Sekou) · S7 cinq fiches « poids stable, taille −4 cm » (Zuri + Aicha) · S8 plan de recrutement diaspora FR / Afrique de l'Ouest, 40 % de femmes (Amara + Kwame).

### Could
C1 photo-logging repas via API tierce · C2 Next 16, sparklines SVG, ESLint · C3 page prix « gratuit pendant la bêta » + enquête Van Westendorp · C4 veille trimestrielle (Adisa).

### Won't (pour l'instant)
Vision IA sur photos, intégrations Apple Health/Garmin, app Expo sur les stores, multi-langues, coaching humain hybride.

## 3. Rétroplanning — bêta privée le 1er décembre 2026
| Sprint | Dates | Contenu | Critère de sortie |
|---|---|---|---|
| S1 « Ce qui est fait est en ligne » | 6–19 oct | M1, M2, M3, M4, M8, S5 | Site public = main ; split et objectif de poids testés sur 6 profils ; E2E vert ; liste d'attente reçoit un e-mail test |
| S2 « Comptes réels » | 20 oct–2 nov | M5, M6, M7, S6 | Un testeur interne crée un compte, questionne le coach IA, retrouve ses données ailleurs ; GO écrit de Sekou |
| S3 « Usage quotidien » | 3–16 nov | S1, S2, S3, S4, M9 | 5 utilisateurs internes 7 jours d'affilée, séance hors-ligne, ≥ 70 % de check-ins |
| S4 « Bêta » | 17–30 nov | M10, S7, S8, C3, tampon 3 j | 50 testeurs invités, charte signée, J0 rempli, aucun bug bloquant |

Chemin critique : D1 → M5 → M6 → M7 → S1. Sans D1 avant le 13 octobre, la bêta glisse d'autant. Premiers Body Reports début janvier 2027, lancement public possible avant le Ramadan 2027.

## 4. Risques et parades
Déploiement silencieusement cassé (contrôle post-déploiement hebdo) · décision hébergement tardive (butoir 13 oct ; repli : bêta avec coach à règles) · parcours perte de poids qui contredit le positionnement (relecture Aicha, poids à 10 % du score, déficit plafonné dans le moteur) · données de santé exposées (aucun compte réel avant le GO de Sekou) · 50 testeurs = 50 hommes du réseau (quotas) · rétention < 30 % à J14 (rappels + mesure) · scope creep (toute demande hors tableau passe en Could, arbitrée le lundi) · fondateur seul développeur (sprints courts, Won't ferme).

## 5. Décisions réservées au fondateur
1. **D1 — Hébergement et clé IA (avant le 13 oct)** : rester 100 % statique (Pages, coach à règles, zéro compte) ou passer sur Vercel + Supabase + domaine (~20–40 €/mois). Avis Kofi : Vercel, sinon pas de bêta digne du nom.
2. **D2 — Prix et modèle (avant le 30 nov)** : gratuit pendant la bêta puis 69–79 €/an ou 9,99 €/mois, sans lifetime ; ou freemium.
3. **D3 — Périmètre mobile** : PWA pour la bêta, Expo sur les stores après preuve de rétention.

Prérequis administratif : nommer le responsable du traitement, sinon M4 ne peut pas se terminer.
