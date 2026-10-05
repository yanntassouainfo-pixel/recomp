# 00 — Analyse produit : RECOMP

> Coach de recomposition corporelle adaptatif. Web (analytique) + mobile (quotidien).
> Promesse : **« Devenir meilleur à poids comparable. »**

## 1. Lecture critique du concept

Le brief est cohérent sur le fond : il décrit un **système d'apprentissage individuel** (quelle stratégie fonctionne pour cette personne) habillé d'une interface minimale. Trois idées structurent tout le reste :

1. **Le poids est un signal parmi d'autres.** Le produit doit prouver cette thèse par ses écrans : le poids n'est jamais le premier chiffre affiché.
2. **Adhérence > perfection.** Toute recommandation doit être filtrée par « est-ce tenable 6 mois pour cette personne ? ».
3. **Savoir ne rien changer.** Un coach qui modifie le plan à chaque bruit de mesure détruit la confiance. Le moteur a besoin d'une notion d'*inertie justifiée*.

## 2. Incohérences et tensions identifiées

| # | Tension dans le brief | Résolution retenue |
|---|---|---|
| 1 | « Ne demande pas 40 informations au premier écran » **vs** moteur qui a besoin de beaucoup de données (morphologie, stockage graisseux, comportements, contraintes). | **Onboarding en 3 couches** : 7 questions essentielles (2 min) → plan « jour 1 » immédiat → le reste est collecté *progressivement* par le daily check-in et le coach (« progressive profiling »). Le profil morphologique et comportemental se remplit sur 2 semaines, pas au premier écran. |
| 2 | « Nutrition concrète : aliments + grammages » **vs** « Mode simple sans comptage ». | Un seul moteur calcule des cibles ; **deux rendus** : grammages (précis) ou portions-main / assiette (simple). Le mode simple n'est pas une dégradation : c'est la même cible exprimée en unités visuelles. |
| 3 | « Photos facultatives » **vs** « Body Composition Score intégrant les photos ». | Le score est **recalculé avec les dimensions disponibles** (pondérations renormalisées). Sans photos, le score reste valide ; les photos ajoutent une dimension « confirmation visuelle » explicitement marquée « observation, pas mesure ». |
| 4 | « Gamification adulte » **vs** « Ne jamais féliciter automatiquement une perte de poids ». | Les récompenses ne portent **jamais** sur le poids. Elles portent sur : constance, progression de force, tour de taille, sommeil, récupération. Le poids est exclu du moteur de récompense. |
| 5 | « Coach IA conversationnel » **vs** « Base scientifique, pas de dogme, garde-fous santé ». | Le LLM ne décide pas : il **explique et reformule** les sorties d'un moteur déterministe (cibles, séances, revues). Chaque recommandation chiffrée vient du moteur, chaque explication du LLM est contrainte par un *context pack* et un registre de preuves. Sans clé API, un coach à règles répond déjà aux 10 questions types. |
| 6 | « Morphologie individuelle » **vs** « pas de somatotypes rigides ». | « Profil morphologique » = ensemble d'**ajustements marginaux** (biais de volume vers les zones prioritaires, choix d'exercices selon leviers/limitations, préférences). Jamais un diagnostic qui change les macros. |
| 7 | « Jeûne intermittent facultatif » **vs** liste d'approches d'experts à comparer. | Un **Evidence Layer** unique : chaque pratique (TRE, chrononutrition, cyclage glucidique…) a une fiche avec niveau de preuve, résumé, et ce que l'on fait concrètement dans l'app. |
| 8 | Le brief parle de « 6 entraînements » à éviter **et** de « Mode performance » avancé. | Le mode performance augmente la **profondeur du suivi**, pas la charge imposée. Le moteur plafonne la charge selon la disponibilité déclarée (heures de travail, séances possibles). |

## 3. Fonctionnalités manquantes dans le brief (ajoutées)

- **Protocole de mesure** : heure, conditions (à jeun, après toilettes), repères anatomiques pour le tour de taille (ombilic). Sans protocole, le signal « tour de taille » est inutilisable.
- **Moyenne mobile du poids** (7 j) et bandes de bruit : afficher une tendance, pas des points.
- **Fenêtre de décision** : le moteur ne révise une stratégie qu'après **≥ 14 jours** de données avec adhérence ≥ 70 %, sauf signaux de sécurité.
- **Budget d'adhérence** : chaque recommandation a un « coût » (temps, charge mentale). La somme hebdomadaire est plafonnée selon le mode (busy/simple/performance).
- **Consentement granulaire** : photos ↔ analyse IA, données ↔ amélioration produit, export/suppression (RGPD) dès le MVP.
- **Déclaration de douleur** distincte de la courbature, avec arrêt du coaching sur la zone et orientation pro.
- **Mode hors-ligne** mobile pour le log de séance (le gym n'a pas toujours de réseau).
- **Journal de décisions du coach** (« le 12/03 nous avons ajouté 25 g de glucides le jour d'entraînement parce que… ») — c'est la mémoire *explicable* du coach.

## 4. Risques

| Risque | Gravité | Mitigation |
|---|---|---|
| Sur-interprétation de photos (masse grasse « estimée ») | Élevée (réglementaire + confiance) | Jamais de % de masse grasse sur photo. Observations qualitatives, formulées comme telles. Analyse uniquement avec consentement explicite ; photos chiffrées, bucket privé. |
| Troubles alimentaires non détectés | Élevée | Signaux : restriction extrême déclarée, perte > 1 %/semaine sur 3 semaines, culpabilité alimentaire récurrente dans le chat, IMC bas. Réponse : ton non jugeant, pas de chiffres caloriques, orientation vers un professionnel, désactivation des cibles de déficit. |
| Dépendance à un fournisseur IA | Moyenne | Orchestrateur multi-fournisseurs, coach à règles comme repli, aucune logique métier dans les prompts. |
| Fatigue décisionnelle utilisateur (trop de données demandées) | Moyenne | Check-in quotidien ≤ 30 s (5 curseurs). Mensurations hebdomadaires. Photos toutes les 4 semaines. |
| Faux plateaux → changements inutiles | Moyenne | Plateau Detector multi-signaux, durée minimale 3 semaines, adhérence vérifiée avant de conclure. |
| Base alimentaire approximative | Moyenne | Valeurs par 100 g marquées « approximatives », source indiquée, correction utilisateur possible. |
| Mineurs / grossesse / pathologies | Élevée | Détection à l'onboarding : bascule en « mode accompagnement général » sans déficit ni cibles agressives + message d'orientation. |

## 5. Positionnement

**Catégorie** : coach de transformation corporelle, pas « app de régime » ni « tracker de muscu ».

**Pour qui (cœur de cible V1)** : adultes 25-50 ans, actifs professionnellement, déjà un peu entraînés ou prêts à l'être, qui veulent *changer de silhouette sans changer de vie*, et qui sont lassés du discours « mange moins ». Cas fondateur : homme, 1,92 m, 93 kg, graisse abdominale, veut garder sa carrure et se densifier.

**Différenciateurs** :
1. Le **Body Composition Score** remplace le poids comme KPI central.
2. Le **Why Engine** + **Evidence Layer** : chaque conseil est explicable et daté scientifiquement.
3. Le **Life Mode** : le plan se recompose autour de la vie (restaurant, voyage, Ramadan, semaine chargée).
4. Le **Plateau Detector** et la règle « ne rien changer » : un coach qui sait attendre.
5. Nutrition **sans occidentalo-centrisme** : la base alimentaire inclut l'Afrique de l'Ouest dès la V1.

**Ton** : adulte, direct, chaleureux, pédagogique. Pas d'emoji-feu, pas de culpabilité.

## 6. Ce que le produit refuse de faire

- Afficher un % de masse grasse déduit d'une photo.
- Féliciter une perte de poids sans contexte.
- Proposer un « rattrapage » après un repas libre.
- Imposer le comptage calorique, le jeûne, le cardio, le low-carb.
- Pousser à l'entraînement en cas de douleur inhabituelle.
- Utiliser des photos pour entraîner un modèle sans consentement explicite et séparé.
