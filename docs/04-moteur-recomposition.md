# 04 — BODY RECOMPOSITION ENGINE

Module `packages/engine`. Déterministe, pur, testé. Les constantes et niveaux de preuve sont centralisés dans `evidence.ts`.

## Entrées → sorties

```
Profile + Measurements + DailyCheckins + WorkoutSessions + PerformanceLogs + MealLogs + LifeEvents + Photos(meta)
            │
            ▼
   computeState()  →  { scores, nutritionDay, trainingDay, dailyBrief, weeklyReview, plateau, alerts, habits }
```

## 1. Scores

### Body Composition Score (0–100, pédagogique)
Fenêtre glissante 28 j vs 28 j précédents. Composantes (pondérations renormalisées sur les dimensions disponibles) :
- Tendance tour de taille (30 %) — signal principal de graisse abdominale.
- Tendance de force (e1RM moyen sur les mouvements clés) (20 %).
- Cohérence poids/objectif (10 %) — un poids stable est **neutre à positif** en recomposition.
- Adhérence entraînement (15 %), sommeil (10 %), récupération/énergie (10 %), photos (5 % si présentes).
Sortie : score + **drivers** (chaque composante avec son signe et une phrase).

### Vitality Score (0–10)
Moyenne pondérée des 14 derniers jours : énergie, sommeil (durée × qualité), récupération, activité (pas), nutrition (régularité), humeur, stress inversé, régularité des check-ins. Un résultat corporel sans vitalité n'est pas un succès.

### Recovery Score (0–100) et readiness
Check-in du jour (sommeil, stress, courbatures, énergie) + charge 7 j (séances, volume) + tendance de performance. → `push | normal | light | rest` et ajustement de séance.

## 2. Nutrition Engine
- Dépense estimée : Mifflin-St Jeor × facteur d'activité (pro + pas) + coût des séances. **Probable** (erreur ±10 %) → présentée comme point de départ, ajustée par les tendances réelles.
- Stratégie selon l'objectif :
  - Recomposition : −10 % jours de repos, maintenance jours d'entraînement (cyclage léger). **Probable**.
  - Perte de gras : −15 à −20 %, plafonné pour ≤ 0,5–0,7 % du poids/semaine. **Solide** sur le rythme modéré pour préserver la masse maigre.
  - Prise de muscle : +5 à +10 %. **Probable**.
- Protéines : 1,6–2,2 g/kg (plus haut en déficit, limité à ~2,4 g/kg). **Solide** (méta-analyse Morton 2018 : ~1,6 g/kg point d'inflexion, IC supérieur ~2,2).
- Lipides ≥ 0,7–1 g/kg ; glucides = reste, biaisés vers les jours d'entraînement. **Probable**.
- Fibres ≈ 14 g / 1 000 kcal. **Solide** (santé) ; satiété **probable**.
- Eau : ≈ 35 ml/kg + 500 ml par séance. **Incertain** quant au chiffre exact ; repère pratique.
- Timing : répartition des protéines sur 3–5 prises (**probable**), fenêtre post-entraînement large (**solide** que la fenêtre de 30 min n'est pas nécessaire).
- Jeûne (TRE) : outil **facultatif**. Évalué par `assessFasting()` : faim, énergie, sommeil, performance, atteinte des protéines. Niveau : **probable que ce n'est pas supérieur** à une alimentation structurée à apports égaux.
- Flex meal : proposé si adhérence ≥ 80 % ou événement déclaré ; **aucune compensation** le lendemain.
- Rendu : `precise` (grammes) ou `simple` (portions-main + assiette).
- Base alimentaire internationale (`foods.ts`) : valeurs ~par 100 g, catégories, cultures, substitutions.

## 3. Training Engine
- Génération : séances/semaine → split (2 : full body ; 3 : full body A/B/C ; 4 : upper/lower ; 5 : U/L/push/pull/legs ; 6 : PPL×2). Durée cible → nombre d'exercices (busy : 4–5 exercices, supersets).
- Biais visuels : « épaules plus larges » → +volume deltoïdes latéraux ; « dos plus large » → tirages ; « ventre plus plat » → pas d'exercice miracle, message honnête + gainage pour la posture.
- Limitations : exclusion de patterns (ex. douleur épaule → pas de développé au-dessus de la tête, substitution).
- Progression : **double progression** (fourchette de reps ; quand toutes les séries atteignent le haut de la fourchette à RIR ≥ 2 → +2,5 % (haut du corps) / +5 % (bas)). e1RM Epley pour les tendances. **Solide** (surcharge progressive), **probable** (volume 10–20 séries/muscle/semaine).
- Deload : déclenché si 2 semaines de baisse de perf + récupération faible, ou toutes les 6–8 semaines. **Probable**.

## 4. Adaptation Engine (Weekly Review)
Règles ordonnées, avec seuils explicites :
1. Sécurité d'abord : perte > 1 %/sem sur 3 sem, douleur persistante, fatigue extrême → messages, réduction de charge.
2. Fenêtre insuffisante (< 14 j ou adhérence < 70 %) → **ne rien changer**, travailler l'adhérence.
3. Poids stable + taille ↓ + force → : **ne rien changer** (« exactement ce que nous cherchons »).
4. Taille ↓ mais force ↓ + énergie ↓ : déficit trop fort → remonter vers maintenance jours d'entraînement.
5. Taille → et poids → sur ≥ 3 semaines avec adhérence ≥ 80 % → `PlateauDetector` confirme → ajustement modéré (−5 à −8 % énergie *ou* +pas) et un seul changement à la fois.
6. Faim élevée + sommeil dégradé → +fibres/volume, glucides le soir, vérifier le déficit.
Sortie : `{ works[], blocks[], change[], keep[] }`, chaque item avec `why` et `evidence`.

## 5. Plateau Detector
Vrai plateau si **tous** : ≥ 21 jours ; |pente poids| < 0,15 %/sem ; |Δ taille| < 0,5 cm ; e1RM flat ; adhérence ≥ 80 % ; photos sans changement déclaré. Sinon → pseudo-plateau avec la cause probable (bruit, durée, adhérence).

## 6. Life Mode
`recomposePlan(event)` : restaurant, voyage, semaine chargée, anniversaire, Ramadan, vacances, pas de salle, maladie. Produit un plan temporaire (nutrition, séances, message) et une date de retour au plan normal.

## 7. Why Engine & Evidence Layer
Chaque sortie importante porte `why: Explanation { context, logic, evidence: EvidenceRef, expectedBenefit }`. Le registre `EVIDENCE` contient niveau (`solid | probable | uncertain | approach`), résumé, sources. Les approches d'experts (chrononutrition, etc.) sont des fiches `approach` avec « principe » et « ce que montrent les données ».

## 8. Personal Response Profile
Apprentissage progressif : réponse au volume (perf vs séries/semaine), tolérance au jeûne, satiété (faim vs fibres/protéines), sommeil vs entraînement tardif, récupération. Stocké comme coefficients bornés, mis à jour par la revue hebdo.

## 9. Programme périodisé & calendrier (`plan/`)
- `phasesFor(profile)` : bloc de 12 semaines par objectif. Recomposition : Fondation (2–3) → Construction (4) → Semaine allégée (1) → Intensification (3–4) → Consolidation (1). Perte de gras : Déficit I (5) → **Pause diète** (1, maintenance) → Déficit II → Consolidation. Prise de muscle : Volume → Allégée → Intensité. Force : Accumulation → Allégée → Intensification → Semaine test. Objectifs énergie/sommeil/santé : Routine → Progression douce → Allégée → Consolidation.
- Chaque phase porte : multiplicateur de volume, RIR cible, mode nutrition (plan ou maintenance), focus, description, pourquoi, niveau de preuve (`periodization`, `diet_break`, `training_frequency`).
- `buildProgramPlan()` pose les séances sur les jours d'entraînement, les mesures et le bilan le dimanche, les photos toutes les 4 semaines et en consolidation ; produit des jalons.
- `buildCalendar()` croise le plan avec l'historique : séances faites / manquées / prévues, mesures et photos faites ou non, événements de vie.
- `computeState()` applique la phase du jour : volume et RIR de la séance, nutrition à maintenance en deload / pause diète / consolidation.
