import type { Evidence, EvidenceId, EvidenceLevel } from './types';

/**
 * EVIDENCE LAYER
 * Registre des affirmations mobilisées par le moteur, avec niveau de preuve.
 * Les sources sont des repères bibliographiques (auteur, année, type) à vérifier
 * et à tenir à jour ; elles ne remplacent pas une revue de littérature.
 */
export const EVIDENCE = {
  protein_intake: {
    id: 'protein_intake',
    level: 'solid',
    title: 'Apport protéique pour préserver/construire le muscle',
    summary:
      "Les méta-analyses d'essais contrôlés montrent qu'au-delà d'environ 1,6 g/kg/j, le gain supplémentaire de masse maigre lié aux protéines plafonne (borne haute de l'intervalle ~2,2 g/kg). En déficit énergétique, viser le haut de la fourchette aide à préserver la masse maigre.",
    whatWeDo: 'Cible 1,6–2,2 g/kg selon objectif et déficit, répartie sur 3–5 prises.',
    sources: [
      { ref: 'Morton et al., Br J Sports Med', year: 2018, type: 'meta-analysis' },
      { ref: 'Helms et al., IJSNEM (déficit chez sujets entraînés)', year: 2014, type: 'systematic-review' },
    ],
  },
  deficit_rate: {
    id: 'deficit_rate',
    level: 'solid',
    title: 'Rythme de perte modéré pour préserver la masse maigre',
    summary:
      "Un rythme de perte rapide (>1 %/semaine) s'accompagne d'une perte de masse maigre et de performance plus importante qu'un rythme modéré (~0,5–0,7 %/semaine) chez des personnes entraînées.",
    whatWeDo: 'Déficit plafonné pour rester ≤ 0,7 %/semaine ; alerte si > 1 %/semaine sur 3 semaines.',
    sources: [
      { ref: 'Garthe et al., IJSNEM', year: 2011, type: 'rct' },
      { ref: 'Helms et al., Sports Med', year: 2014, type: 'systematic-review' },
    ],
  },
  calorie_cycling: {
    id: 'calorie_cycling',
    level: 'probable',
    title: 'Cyclage des apports entre jours d’entraînement et de repos',
    summary:
      "Manger un peu plus les jours d'entraînement et un peu moins les jours de repos n'a pas démontré de supériorité métabolique nette ; l'intérêt principal est pratique : performance en séance et adhérence.",
    whatWeDo: 'Maintenance les jours d’entraînement, léger déficit les jours de repos en recomposition.',
    sources: [{ ref: 'Peos et al., Sports (revue narrative)', year: 2019, type: 'narrative' }],
  },
  weight_noise: {
    id: 'weight_noise',
    level: 'solid',
    title: 'Le poids quotidien est bruité',
    summary:
      "Le poids varie de 1 à 2 kg d'un jour à l'autre (eau, glycogène, sel, transit). Seule une moyenne glissante sur 7 jours est interprétable, et une tendance demande au moins 2–3 semaines.",
    whatWeDo: 'Affichage en moyenne 7 jours ; aucune décision sur moins de 14 jours.',
    sources: [{ ref: 'Bhutani et al., Obesity (variabilité du poids)', year: 2017, type: 'rct' }],
  },
  waist_marker: {
    id: 'waist_marker',
    level: 'solid',
    title: 'Le tour de taille comme marqueur de graisse abdominale',
    summary:
      "Le tour de taille est un indicateur validé de l'adiposité abdominale et du risque cardiométabolique, indépendamment du poids. Il est plus sensible qu'une balance pour suivre une recomposition.",
    whatWeDo: 'Mesure hebdomadaire au niveau de l’ombilic, à jeun ; signal principal du score.',
    sources: [{ ref: 'Ross et al., Nat Rev Endocrinol (consensus IAS/ICCR)', year: 2020, type: 'consensus' }],
  },
  progressive_overload: {
    id: 'progressive_overload',
    level: 'solid',
    title: 'Surcharge progressive',
    summary:
      "L'augmentation progressive de la charge, des répétitions ou du volume est le moteur principal de l'hypertrophie et de la force chez les personnes entraînées.",
    whatWeDo: 'Double progression : fourchette de reps puis augmentation de charge.',
    sources: [{ ref: 'ACSM Position Stand, Med Sci Sports Exerc', year: 2009, type: 'guideline' }],
  },
  volume_hypertrophy: {
    id: 'volume_hypertrophy',
    level: 'probable',
    title: 'Volume hebdomadaire et hypertrophie',
    summary:
      "Relation dose-réponse : ~10 séries ou plus par groupe musculaire et par semaine produisent davantage d'hypertrophie que moins de 5, avec des rendements décroissants et une variabilité individuelle importante.",
    whatWeDo: '10–20 séries/muscle/semaine selon niveau, plafonné par la récupération.',
    sources: [{ ref: 'Schoenfeld et al., J Sports Sci', year: 2017, type: 'meta-analysis' }],
  },
  double_progression: {
    id: 'double_progression',
    level: 'probable',
    title: 'Double progression',
    summary:
      "Méthode pratique dérivée du principe de surcharge : on augmente la charge lorsque le haut de la fourchette de répétitions est atteint sur toutes les séries avec une réserve suffisante.",
    whatWeDo: '+2,5 % (haut du corps) / +5 % (bas du corps) quand toutes les séries atteignent le haut de la fourchette à RIR ≥ 2.',
    sources: [{ ref: 'Dérivé du consensus sur la surcharge progressive', year: 2009, type: 'consensus' }],
  },
  deload: {
    id: 'deload',
    level: 'probable',
    title: 'Deload / semaine allégée',
    summary:
      "Réduire temporairement le volume ou l'intensité permet de dissiper la fatigue accumulée ; les preuves directes sont limitées, mais le principe de gestion fatigue/forme est robuste.",
    whatWeDo: 'Semaine à −40 % de volume si baisse de performance 2 semaines + récupération faible, ou toutes les 6–8 semaines.',
    sources: [{ ref: 'Bell et al., Sports Med (revue)', year: 2023, type: 'systematic-review' }],
  },
  protein_distribution: {
    id: 'protein_distribution',
    level: 'probable',
    title: 'Répartition des protéines sur la journée',
    summary:
      "Répartir l'apport protéique en 3–5 prises de 0,4 g/kg environ semble légèrement plus favorable à la synthèse protéique qu'une seule grosse prise, mais l'apport total reste le facteur dominant.",
    whatWeDo: 'Une source de protéines à chaque repas ; optionnel : collation protéinée.',
    sources: [{ ref: 'Schoenfeld & Aragon, JISSN', year: 2018, type: 'narrative' }],
  },
  anabolic_window: {
    id: 'anabolic_window',
    level: 'solid',
    title: 'La fenêtre « 30 minutes » n’est pas nécessaire',
    summary:
      "Lorsque l'apport protéique quotidien est suffisant, le timing précis autour de la séance a un effet faible ou nul. Un repas dans les quelques heures avant ou après la séance suffit.",
    whatWeDo: 'Repas contenant des protéines dans les 2–3 h autour de la séance ; pas de stress sur la minute.',
    sources: [{ ref: 'Schoenfeld et al., PeerJ', year: 2017, type: 'rct' }, { ref: 'Aragon & Schoenfeld, JISSN', year: 2013, type: 'narrative' }],
  },
  carbs_around_training: {
    id: 'carbs_around_training',
    level: 'probable',
    title: 'Glucides autour de l’entraînement',
    summary:
      "Pour des séances de force de 45–75 min, des glucides avant la séance améliorent surtout la perception d'effort et le volume réalisable ; l'effet sur l'hypertrophie passe par la qualité des séances.",
    whatWeDo: 'Majorité des glucides du jour dans les repas avant/après la séance.',
    sources: [{ ref: 'Henselmans et al., Nutrients (revue)', year: 2022, type: 'systematic-review' }],
  },
  time_restricted_eating: {
    id: 'time_restricted_eating',
    level: 'probable',
    title: 'Jeûne intermittent / fenêtre alimentaire réduite (TRE)',
    summary:
      "Associé à la musculation, le TRE donne des adaptations de masse maigre et de force globalement similaires à une alimentation non restreinte à apports protéiques égaux ; il peut aider certaines personnes à contrôler leurs apports. Il n'est pas intrinsèquement supérieur.",
    whatWeDo: 'Outil facultatif, proposé uniquement si faim, énergie, sommeil et performance restent bons et que les protéines sont atteintes.',
    sources: [
      { ref: 'Moro et al., J Transl Med', year: 2016, type: 'rct' },
      { ref: 'Méta-analyse TRE + entraînement en résistance', year: 2026, type: 'meta-analysis' },
    ],
  },
  fiber: {
    id: 'fiber',
    level: 'solid',
    title: 'Fibres : santé et satiété',
    summary:
      "Un apport d'environ 14 g/1 000 kcal (25–35 g/j) est associé à de meilleurs marqueurs de santé ; l'effet sur la satiété est probable et dépend du type de fibres.",
    whatWeDo: 'Légumes à chaque repas, légumineuses et céréales complètes.',
    sources: [{ ref: 'Reynolds et al., Lancet', year: 2019, type: 'meta-analysis' }],
  },
  hydration: {
    id: 'hydration',
    level: 'uncertain',
    title: 'Objectif d’hydratation',
    summary:
      "Le chiffre exact varie beaucoup ; ~30–35 ml/kg plus les pertes à l'effort est un repère pratique, pas une prescription. La soif et la couleur des urines restent de bons guides.",
    whatWeDo: 'Repère personnalisé, ajusté les jours d’entraînement et de chaleur.',
    sources: [{ ref: 'EFSA Dietary Reference Values for water', year: 2010, type: 'guideline' }],
  },
  sleep_resistance_training: {
    id: 'sleep_resistance_training',
    level: 'probable',
    title: 'Musculation et sommeil',
    summary:
      "Le renforcement musculaire est associé à une amélioration de certains aspects du sommeil (qualité subjective, latence). Aucune promesse thérapeutique : on parle de tendance, pas de traitement.",
    whatWeDo: 'Suivre durée, régularité, qualité ; recommandations comportementales simples.',
    sources: [{ ref: 'Kovacevic et al., Sleep Med Rev', year: 2018, type: 'systematic-review' }],
  },
  sleep_and_fat_loss: {
    id: 'sleep_and_fat_loss',
    level: 'probable',
    title: 'Sommeil court et composition corporelle',
    summary:
      "En déficit, un sommeil restreint (~5,5 h) oriente la perte vers la masse maigre plutôt que la masse grasse, et augmente la faim. Le sommeil est un levier de recomposition, pas un bonus.",
    whatWeDo: 'Objectif de régularité du coucher ; si sommeil < 6 h répété : on allège l’entraînement et on protège le sommeil avant de toucher aux calories.',
    sources: [{ ref: 'Nedeltcheva et al., Ann Intern Med', year: 2010, type: 'rct' }],
  },
  steps_neat: {
    id: 'steps_neat',
    level: 'probable',
    title: 'Pas quotidiens et dépense hors exercice',
    summary:
      "La marche quotidienne augmente la dépense sans fatigue nerveuse et est associée à de meilleurs résultats de santé. Le seuil de 10 000 pas est un repère marketing ; 7 000–9 000 montrent déjà la majorité des bénéfices.",
    whatWeDo: 'Cible de pas personnalisée (+1 000 à +2 000 par rapport à l’habitude), jamais 10 000 par défaut.',
    sources: [{ ref: 'Paluch et al., Lancet Public Health', year: 2022, type: 'meta-analysis' }],
  },
  flex_meal_adherence: {
    id: 'flex_meal_adherence',
    level: 'probable',
    title: 'Repas libre et adhérence',
    summary:
      "Une flexibilité alimentaire planifiée est associée à une meilleure adhérence à long terme qu'une restriction rigide ; la rigidité (« tout ou rien ») est liée à davantage d'abandons.",
    whatWeDo: 'Flex meal proposé quand il sert la vie sociale ou l’adhérence ; aucune compensation ensuite.',
    sources: [{ ref: 'Stewart et al., Appetite (restriction flexible vs rigide)', year: 2002, type: 'rct' }, { ref: 'Conlin et al., JISSN', year: 2021, type: 'rct' }],
  },
  spot_reduction: {
    id: 'spot_reduction',
    level: 'solid',
    title: 'Pas de perte de gras localisée',
    summary:
      "Travailler les abdominaux ne fait pas perdre la graisse abdominale de façon ciblée. La graisse abdominale baisse avec la perte de gras globale ; le gainage améliore la posture et l'apparence du ventre, pas sa graisse.",
    whatWeDo: 'Pas de « programme ventre plat » ; déficit modéré + muscle + sommeil + tour de taille comme mesure.',
    sources: [{ ref: 'Vispute et al., J Strength Cond Res', year: 2011, type: 'rct' }],
  },
  chrononutrition: {
    id: 'chrononutrition',
    level: 'approach',
    title: 'Chrononutrition (approche popularisée par A. Delabos)',
    summary:
      "Principe : adapter la composition des repas à l'heure (lipides le matin, protéines et féculents le midi, sucré en collation, dîner léger). Ce que montrent les données : les effets de l'heure des repas existent mais sont modestes ; l'apport total et la qualité des aliments restent dominants. Aucun essai robuste ne montre une recomposition supérieure à apports égaux.",
    whatWeDo: 'Non imposé. Si l’utilisateur l’apprécie, le moteur structure les repas dans cet esprit tout en garantissant les cibles protéiques.',
    sources: [{ ref: 'Revues sur chrononutrition / meal timing (ex. Dashti et al., Adv Nutr)', year: 2019, type: 'narrative' }],
  },
  low_carb: {
    id: 'low_carb',
    level: 'probable',
    title: 'Low-carb vs autres répartitions',
    summary:
      "À calories et protéines égales, la perte de masse grasse est similaire entre régimes pauvres ou riches en glucides. Le meilleur choix est celui que la personne tient, en préservant la performance à l'entraînement.",
    whatWeDo: 'Pas de dogme : glucides calibrés selon volume d’entraînement et préférence.',
    sources: [{ ref: 'Hall & Guo, Gastroenterology (méta-analyse)', year: 2017, type: 'meta-analysis' }],
  },
  photo_bodyfat: {
    id: 'photo_bodyfat',
    level: 'solid',
    title: 'Pas de % de masse grasse à partir d’une photo',
    summary:
      "Aucune méthode photographique grand public n'atteint une précision suffisante pour une estimation individuelle fiable. Les photos servent à des observations qualitatives entre deux clichés comparables.",
    whatWeDo: 'Observations prudentes uniquement, présentées comme telles ; jamais de pourcentage.',
    sources: [{ ref: 'Limites des méthodes anthropométriques/photographiques — revues de validation', year: 2021, type: 'narrative' }],
  },
  readiness_autoregulation: {
    id: 'readiness_autoregulation',
    level: 'probable',
    title: 'Autorégulation de la séance selon l’état du jour',
    summary:
      "Ajuster le volume/l'intensité selon la récupération perçue (RPE/RIR, questionnaires de bien-être) donne des résultats au moins équivalents aux plans fixes avec moins de fatigue accumulée.",
    whatWeDo: 'Check-in avant séance → séance prévue / réduite / allégée / mobilité.',
    sources: [{ ref: 'Greig et al., Sports Med (revue autorégulation)', year: 2020, type: 'systematic-review' }],
  },
  recomposition_feasibility: {
    id: 'recomposition_feasibility',
    level: 'probable',
    title: 'Perdre du gras et gagner du muscle en même temps',
    summary:
      "La recomposition simultanée est documentée chez des personnes entraînées, surtout avec apport protéique élevé, entraînement structuré et déficit léger. Elle est plus lente qu'une phase dédiée, mais compatible avec la vie réelle.",
    whatWeDo: 'Stratégie par défaut pour les profils « sec + carrure » : déficit léger, protéines hautes, progression de force.',
    sources: [{ ref: 'Barakat et al., Strength Cond J', year: 2020, type: 'narrative' }],
  },
} as Record<EvidenceId, Evidence>;

EVIDENCE.periodization = {
  id: 'periodization',
  level: 'probable',
  title: 'Périodisation par phases',
  summary:
    "Organiser l'entraînement en blocs (fondation, construction, intensification, allègement) donne des gains de force légèrement supérieurs à un programme constant chez des personnes entraînées ; pour l'hypertrophie, l'effet est faible mais la structure aide à gérer la fatigue et l'adhérence.",
  whatWeDo: 'Plan en 12 semaines par objectif : phases avec volume, réserve (RIR) et nutrition propres, semaine allégée planifiée.',
  sources: [{ ref: 'Williams et al., Sports Med (méta-analyse périodisation vs non périodisé)', year: 2017, type: 'meta-analysis' }],
};
EVIDENCE.diet_break = {
  id: 'diet_break',
  level: 'probable',
  title: 'Pause diète (retour temporaire à maintenance)',
  summary:
    "Alterner des blocs de déficit avec des semaines à maintenance a donné, dans l'essai MATADOR, une perte de masse grasse supérieure et une meilleure conservation de la dépense énergétique qu'un déficit continu. Les réplications sont mitigées ; l'intérêt principal est l'adhérence et la récupération.",
  whatWeDo: 'En phase perte de gras : une semaine à maintenance toutes les 5–6 semaines, planifiée à l’avance.',
  sources: [{ ref: 'Byrne et al., Int J Obes (MATADOR)', year: 2018, type: 'rct' }, { ref: 'Peos et al., Med Sci Sports Exerc (ICECAP)', year: 2021, type: 'rct' }],
};
EVIDENCE.training_frequency = {
  id: 'training_frequency',
  level: 'probable',
  title: 'Fréquence : chaque muscle 2 fois par semaine',
  summary: "À volume égal, entraîner un muscle 2 fois par semaine tend à produire un peu plus d'hypertrophie qu'une seule fois ; au-delà, pas de différence nette.",
  whatWeDo: 'Répartition des séances dans la semaine pour que chaque groupe soit sollicité ≥ 2 fois.',
  sources: [{ ref: 'Schoenfeld et al., Sports Med', year: 2016, type: 'meta-analysis' }],
};

export const EVIDENCE_LABEL: Record<EvidenceLevel, string> = {
  solid: 'Solide',
  probable: 'Probable',
  uncertain: 'Incertain',
  approach: 'Approche',
};

export function getEvidence(id: EvidenceId): Evidence {
  return EVIDENCE[id];
}

/**
 * Fiches « experts et courants » : principe + ce que montrent les données.
 * Les résumés de principe sont des descriptions générales ; vérifier avec les sources primaires
 * des auteurs avant toute citation publique.
 */
export interface ApproachCard {
  id: string;
  name: string;
  attributedTo: string;
  principle: string;
  whatDataShow: string;
  level: EvidenceLevel;
  howWeUseIt: string;
}

export const APPROACHES: ApproachCard[] = [
  {
    id: 'chrononutrition',
    name: 'Chrononutrition',
    attributedTo: 'Alain Delabos',
    principle:
      'Répartir les familles d’aliments selon l’heure : gras le matin, dense le midi, sucré au goûter, léger le soir, en lien avec des rythmes hormonaux supposés.',
    whatDataShow:
      'Les effets du timing existent mais sont modestes face à l’apport total et à la qualité ; aucune supériorité démontrée à apports égaux. Peut aider certaines personnes à structurer leur journée.',
    level: 'approach',
    howWeUseIt: 'Option de structure des repas, jamais imposée ; cibles protéiques garanties quoi qu’il arrive.',
  },
  {
    id: 'coaching_francophone_pragmatique',
    name: 'Coaching nutrition « réaliste » francophone',
    attributedTo: 'Nicolas Ott, Antoine Fombonne (approches de coaching populaires)',
    principle:
      'Approches centrées sur la simplicité, la régularité, la place des protéines et l’ajustement progressif plutôt que la restriction brutale (résumé général ; à vérifier auprès des auteurs).',
    whatDataShow:
      'Les composantes alignées avec la littérature (protéines suffisantes, déficit modéré, surcharge progressive, adhérence) sont bien soutenues ; les éléments spécifiques à chaque auteur ne sont pas évalués par des essais contrôlés.',
    level: 'approach',
    howWeUseIt: 'Nous retenons les principes convergents avec les données ; nous n’attribuons aucune règle spécifique sans source.',
  },
  {
    id: 'if_tre',
    name: 'Jeûne intermittent / TRE',
    attributedTo: 'Courant populaire (16/8, 14/10…)',
    principle: 'Concentrer les apports dans une fenêtre horaire réduite.',
    whatDataShow:
      'Associé à la musculation : adaptations similaires à une alimentation non restreinte à apports égaux (méta-analyse 2026). Utile comme outil de contrôle des apports pour certains, délétère pour d’autres (faim, performance, protéines manquées).',
    level: 'probable',
    howWeUseIt: 'Facultatif, évalué par le moteur sur faim, énergie, sommeil, performance et protéines.',
  },
  {
    id: 'low_carb',
    name: 'Low-carb / céto',
    attributedTo: 'Courant populaire',
    principle: 'Réduire fortement les glucides pour favoriser l’oxydation des graisses.',
    whatDataShow:
      'À calories et protéines égales, perte de masse grasse équivalente ; performance en musculation parfois dégradée si glucides très bas.',
    level: 'probable',
    howWeUseIt: 'Pas de dogme : la répartition suit la préférence et le volume d’entraînement.',
  },
];
