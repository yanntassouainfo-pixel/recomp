import type { EvidenceId, ISODate, LifeEvent, LifeEventType, UserState } from '../types';
import { addDays } from '../stats';

export interface LifePlan {
  type: LifeEventType;
  title: string;
  message: string;
  nutrition: string[];
  training: string[];
  recovery: string[];
  resumesOn: ISODate;
  evidenceId: EvidenceId;
}

/** Le plan se recompose autour de la vie, pas l'inverse. */
export function recomposeForEvent(state: UserState, event: LifeEvent): LifePlan {
  const p = state.profile;
  const resumesOn = addDays(event.endDate, 1);
  switch (event.type) {
    case 'restaurant':
      return {
        type: event.type, title: 'Restaurant ce soir', resumesOn, evidenceId: 'flex_meal_adherence',
        message: 'Un repas ne décide pas d’une recomposition. Profite. Demain, tu reprends simplement le rythme normal — aucune compensation.',
        nutrition: ['Déjeuner un peu plus léger en glucides et riche en protéines, sans sauter de repas (sauter = arriver affamé).', 'Au restaurant : commence par la source de protéines, ajoute des légumes, choisis le plaisir qui compte vraiment (le dessert OU les frites OU l’alcool, pas forcément les trois).', 'Eau à table, un verre d’alcool max si tu en prends.'],
        training: ['Si séance prévue : garde-la, idéalement avant le repas.'],
        recovery: ['Couche-toi à l’heure habituelle si possible.'],
      };
    case 'birthday':
      return {
        type: event.type, title: 'Anniversaire', resumesOn, evidenceId: 'flex_meal_adherence',
        message: 'C’est un repas libre planifié, pas un écart. On ne compte pas, on ne compense pas, on reprend demain.',
        nutrition: ['Protéines à chaque repas de la journée, le reste est libre.', 'Hydratation normale.'],
        training: ['Séance prévue si elle tombe ce jour-là ; sinon rien à rattraper.'],
        recovery: ['Rien de spécial. Dormir.'],
      };
    case 'travel': {
      const days = Math.max(1, Math.round((Date.parse(event.endDate) - Date.parse(event.startDate)) / 86_400_000) + 1);
      return {
        type: event.type, title: `Voyage ${days} jour${days > 1 ? 's' : ''}`, resumesOn, evidenceId: 'protein_intake',
        message: `${days} jours sans routine ne défont pas des semaines de travail. Objectif : maintenir, pas progresser.`,
        nutrition: ['Ancre de protéines à chaque repas (œufs, yaourt, poisson, viande, légumineuses) — c’est la seule règle.', 'Marche pour découvrir : 8 000–10 000 pas s’obtiennent naturellement.', 'Pas de cible calorique : mange à satiété, pas au-delà.'],
        training: ['Séance hôtel 25 min, 2–3× : pompes, squats, fentes, rowing inversé (table), gainage — 3 séries chacun.', 'Si salle disponible : full body unique avec les exercices que tu connais.'],
        recovery: ['Décalage horaire : lumière du jour le matin, pas d’écran tard.'],
      };
    }
    case 'busy_week':
      return {
        type: event.type, title: 'Semaine très chargée', resumesOn, evidenceId: 'readiness_autoregulation',
        message: 'On passe en minimum efficace. Deux séances de 30 minutes et des repas simples valent mieux qu’un plan parfait abandonné.',
        nutrition: ['Repas répétés et simples : même petit déjeuner, déjeuner « protéine + légumes + féculent », dîner idem.', 'Pas de pesée des aliments cette semaine.', 'Protéines à chaque repas, c’est tout.'],
        training: [`${Math.min(2, p.sessionsPerWeek)} séances full body de 30 min : 4 exercices composés, 3 séries, 90 s de repos.`, 'Si aucune séance possible : 2 × 10 min (pompes + squats + gainage) à la maison.'],
        recovery: ['Protège le sommeil : c’est la variable qui souffre le plus les semaines chargées.'],
      };
    case 'ramadan':
      return {
        type: event.type, title: 'Ramadan', resumesOn, evidenceId: 'protein_intake',
        message: 'Le plan s’adapte au jeûne, pas l’inverse. Objectif : maintenir muscle et énergie ; la recomposition reprend après.',
        nutrition: ['Iftar : commence par eau + dattes, puis une vraie source de protéines, légumes, et féculents en quantité modérée.', 'Suhoor : protéines lentes (œufs, yaourt, fromage blanc, légumineuses), glucides complexes, fibres, et 500–750 ml d’eau.', 'Hydratation : viser la cible du jour entre iftar et suhoor, par petites quantités.', 'Pas d’objectif de déficit : on vise la maintenance.'],
        training: ['Séances après l’iftar (1 h 30–2 h après) ou juste avant la rupture pour les séances courtes.', 'Volume réduit de 30 %, charges maintenues : on préserve, on ne construit pas.', '2–3 séances suffisent.'],
        recovery: ['Sieste courte si possible ; coucher régulier malgré les horaires décalés.'],
      };
    case 'holiday':
      return {
        type: event.type, title: 'Vacances', resumesOn, evidenceId: 'flex_meal_adherence',
        message: 'Les vacances servent la récupération — mentale aussi. Maintenance détendue, mouvement plaisir.',
        nutrition: ['Une règle : des protéines à chaque repas. Le reste est libre, en écoutant la satiété.', 'Hydratation surtout si chaleur.'],
        training: ['Activité plaisir : nage, marche, vélo, rando.', 'Optionnel : 2 séances courtes au poids du corps.'],
        recovery: ['Dors. C’est le moment de rembourser la dette.'],
      };
    case 'no_gym':
      return {
        type: event.type, title: 'Pas de salle cette semaine', resumesOn, evidenceId: 'progressive_overload',
        message: 'Le muscle répond à la tension, pas au logo de la salle. Programme maison équivalent.',
        nutrition: ['Rien ne change.'],
        training: ['Remplacement : pompes (lestées sac à dos), squats tempo lent / pistol assisté, fentes, rowing inversé sous une table, pont fessier unilatéral, gainage.', 'Même nombre de séances, 3–4 séries à 2 reps de la réserve, 12–20 répétitions.'],
        recovery: ['Idem.'],
      };
    case 'illness':
      return {
        type: event.type, title: 'Maladie', resumesOn, evidenceId: 'readiness_autoregulation',
        message: 'Pas d’entraînement. Manger à maintenance, protéines, hydratation, dormir. On reprend progressivement (−30 % de volume la première semaine).',
        nutrition: ['Maintenance, aucun déficit.', 'Protéines réparties, hydratation, aliments faciles.'],
        training: ['Aucune séance tant que fièvre ou fatigue marquée.', 'Reprise : première séance à 70 % du volume habituel.'],
        recovery: ['Repos. Consulte si les symptômes persistent ou s’aggravent.'],
      };
  }
}

export function activeLifeEvent(state: UserState, today: ISODate): LifeEvent | null {
  return state.lifeEvents.find((e) => e.startDate <= today && e.endDate >= today) ?? null;
}

export function nutritionEventFor(state: UserState, today: ISODate): LifeEventType | null {
  const e = activeLifeEvent(state, today);
  return e ? e.type : null;
}
