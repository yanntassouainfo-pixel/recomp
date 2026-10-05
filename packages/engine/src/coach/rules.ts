import type { EvidenceId, UserState } from '../types';
import type { ComputedState } from '../compute';
import { EVIDENCE } from '../evidence';
import { recomposeForEvent } from '../adaptation/lifeMode';
import { adaptHabitualDish, TRADITIONAL_DISHES } from '../nutrition/plan';
import { FOODS } from '../nutrition/foods';
import { addDays as addDaysStr } from '../stats';

export interface CoachReply {
  text: string;
  evidenceIds: EvidenceId[];
  intent: string;
  /** vrai si la réponse vient du coach déterministe (pas d'un LLM) */
  deterministic: true;
}

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

const has = (q: string, ...words: string[]) => words.some((w) => q.includes(norm(w)));

/**
 * COACH À RÈGLES — repli déterministe quand aucun fournisseur LLM n'est configuré.
 * Il répond aux situations types à partir de l'état calculé. Même mémoire, même garde-fous.
 */
export function rulesCoach(question: string, state: UserState, c: ComputedState): CoachReply {
  const q = norm(question);
  const p = state.profile;
  const simple = p.nutritionPrecision === 'simple';
  const ev = (ids: EvidenceId[]) => ids;

  // Sécurité d'abord
  if (has(q, 'vomir', 'me faire vomir', 'laxatif', 'je ne mange plus', 'je deteste mon corps', 'je me degoute', 'arreter de manger')) {
    return reply('safety', ['photo_bodyfat'], `Ce que tu décris dépasse le cadre d’un coaching sportif, et je préfère te le dire franchement plutôt que de te donner un plan. Ton rapport à la nourriture et à ton corps mérite d’être accompagné par un professionnel (médecin, psychologue, diététicien formé). Je reste là pour la partie entraînement et structure des repas, sans chiffres ni déficit, le temps qu’il faut. Veux-tu qu’on simplifie au maximum pour les prochains jours ?`);
  }
  if (has(q, 'douleur', 'mal au', 'mal a l', 'blessure', 'ca lance', 'ca tire')) {
    return reply('pain', ['readiness_autoregulation'], `Une douleur inhabituelle n’est pas une courbature : on ne pousse pas dessus. Aujourd’hui, retire les exercices qui sollicitent la zone (je peux te proposer des substitutions), garde le reste si c’est confortable, et marche. Si la douleur persiste plus de quelques jours, s’intensifie, ou s’accompagne de gonflement ou de perte de force, consulte un professionnel de santé. Décaler une séance coûte un jour ; ignorer une douleur peut coûter deux mois.`);
  }

  // Plateau / poids
  if (has(q, 'poids ne bouge', 'poids stagne', 'plateau', 'ne perds plus', 'balance ne bouge', 'stagne')) {
    const pl = c.plateau;
    const waist = c.review.metrics.waistDelta;
    const str = c.review.metrics.strengthDeltaPct;
    let text = '';
    if (pl.kind === 'progressing') {
      text = `Ton poids ne bouge presque pas, mais ${waist !== null ? `ton tour de taille a évolué de ${waist} cm` : 'tes mesures évoluent'}${str !== null && str > 0 ? ` et ta force progresse de ${str} %` : ''}. C’est exactement le type d’évolution que nous recherchons en recomposition : la balance ne voit pas la différence entre 1 kg de gras perdu et 1 kg de muscle gagné. Ne change rien pour l’instant. On regarde à nouveau dans deux semaines.`;
    } else if (pl.kind === 'insufficient_data') {
      text = `${pl.reasons[0]} Le poids quotidien varie de 1 à 2 kg avec l’eau, le sel et le transit. Ce que je te demande : pèse-toi le matin à jeun, et surtout mesure ton tour de taille dimanche. ${pl.recommendation}`;
    } else if (pl.kind === 'pseudo_plateau') {
      text = `Ce n’est pas un vrai plateau. ${pl.reasons.join(' ')} ${pl.recommendation}`;
    } else {
      text = `Cette fois, c’est un plateau réel : poids, tour de taille et force stables depuis 3–4 semaines avec une bonne régularité. On fait UN ajustement : ${pl.recommendation.replace('Un seul ajustement à la fois : ', '')} Un seul changement à la fois, pour savoir ce qui agit.`;
    }
    return reply('plateau', ['weight_noise', 'waist_marker'], text);
  }

  // Séance ratée
  if (has(q, 'rate ma seance', 'raté ma séance', 'manque ma seance', 'pas pu m entrainer', 'pas fait ma seance', 'sauté ma séance', 'saute ma seance')) {
    const next = c.program.days.find((d) => d.id !== c.todayWorkout?.id);
    return reply('missed_session', ['progressive_overload'], `Une séance ratée ne se rattrape pas, elle se remplace : tu fais la séance prévue au prochain créneau, et le programme glisse d’un jour. Pas de double séance, pas de « punition ». Sur 6 mois, c’est la régularité moyenne qui compte, pas une semaine parfaite. Prochaine séance : ${next ? next.name : 'celle qui était prévue'}. Si tu as 20 minutes aujourd’hui : marche rapide ou 3 séries de pompes et squats, c’est déjà un stimulus.`);
  }

  // Fatigue : s'entraîner ?
  if (has(q, 'fatigue', 'fatigué', 'crevé', 'creve', 'epuise', 'épuisé', 'm entraine quand meme', 'je m entraine ou pas')) {
    const r = c.recovery;
    const map: Record<string, string> = {
      push: `Ton score de récupération est à ${r.score}/100 : tu es en forme malgré l’impression. Fais la séance prévue ; si l’échauffement confirme la fatigue, retire une série par exercice.`,
      normal: `Récupération à ${r.score}/100 : séance prévue, sans chercher de record. L’échauffement est ton juge : si après 10 minutes ça ne vient pas, passe en version allégée.`,
      light: `Récupération à ${r.score}/100${r.reasons.length ? ` (${r.reasons.join(', ').toLowerCase()})` : ''}. Oui, tu t’entraînes, mais en version allégée : une série de moins par exercice et une rep de réserve en plus. Tu gardes le stimulus sans creuser la dette.`,
      rest: `Récupération à ${r.score}/100${r.reasons.length ? ` (${r.reasons.join(', ').toLowerCase()})` : ''}. Aujourd’hui, non : marche 20–30 min, mobilité, coucher tôt. La séance est décalée, pas perdue. S’entraîner épuisé n’ajoute pas de muscle, ça ajoute de la fatigue.`,
    };
    return reply('tired', ['readiness_autoregulation', 'sleep_and_fat_loss'], map[r.readiness] ?? map.normal!);
  }

  // Restaurant / invité
  if (has(q, 'restaurant', 'invite', 'invité', 'resto', 'diner chez', 'dîner chez', 'soiree', 'soirée')) {
    const plan = recomposeForEvent(state, { id: 'tmp', type: 'restaurant', startDate: c.today, endDate: c.today });
    return reply('restaurant', ['flex_meal_adherence'], `${plan.message} Concrètement : ${plan.nutrition.join(' ')}`);
  }
  if (has(q, 'anniversaire')) {
    const plan = recomposeForEvent(state, { id: 'tmp', type: 'birthday', startDate: c.today, endDate: c.today });
    return reply('birthday', ['flex_meal_adherence'], `${plan.message} ${plan.nutrition.join(' ')}`);
  }
  // Voyage
  if (has(q, 'voyage', 'deplacement', 'déplacement', 'hotel', 'hôtel', 'je pars')) {
    const m = q.match(/(\d+)\s*(jour|jours|j)\b/);
    const days = m ? Number(m[1]) : 4;
    const plan = recomposeForEvent(state, { id: 'tmp', type: 'travel', startDate: c.today, endDate: addDaysStr(c.today, days - 1) });
    return reply('travel', ['protein_intake'], `${plan.message} Nutrition : ${plan.nutrition.join(' ')} Entraînement : ${plan.training.join(' ')}`);
  }
  if (has(q, 'ramadan')) {
    const plan = recomposeForEvent(state, { id: 'tmp', type: 'ramadan', startDate: c.today, endDate: addDaysStr(c.today, 29) });
    return reply('ramadan', ['protein_intake'], `${plan.message} ${plan.nutrition.join(' ')} Entraînement : ${plan.training.join(' ')}`);
  }
  if (has(q, 'pas de salle', 'salle fermee', 'salle fermée', 'sans salle', 'a la maison', 'à la maison')) {
    const plan = recomposeForEvent(state, { id: 'tmp', type: 'no_gym', startDate: c.today, endDate: addDaysStr(c.today, 6) });
    return reply('no_gym', ['progressive_overload'], `${plan.message} ${plan.training.join(' ')}`);
  }
  if (has(q, 'semaine chargee', 'semaine chargée', 'tres occupe', 'très occupé', 'pas le temps', 'deborde', 'débordé')) {
    const plan = recomposeForEvent(state, { id: 'tmp', type: 'busy_week', startDate: c.today, endDate: addDaysStr(c.today, 6) });
    return reply('busy_week', ['readiness_autoregulation'], `${plan.message} ${plan.training.join(' ')} Côté repas : ${plan.nutrition.join(' ')}`);
  }

  // Très faim
  if (has(q, 'tres faim', 'très faim', 'j ai faim', 'affame', 'affamé', 'envie de manger', 'fringale')) {
    return reply('hunger', ['fiber', 'protein_intake', 'sleep_and_fat_loss'], `La faim est une donnée, pas une faute. Aujourd’hui : ${simple ? 'ajoute un poing de légumes ou de légumineuses à chaque repas et garde ta paume de protéines' : `monte les légumes et légumineuses, vise le haut de ta fourchette protéique (${c.nutrition.proteinG} g)`}, et garde des glucides au dîner. Si c’est un jour de repos, tu peux manger à maintenance : un jour à maintenance n’efface rien. Si la faim est forte depuis plusieurs jours, regarde ton sommeil (${c.review.metrics.sleepAvg ?? '—'} h en moyenne) : sous 6,5 h, la faim monte mécaniquement. Je le notera pour ta revue de dimanche.`);
  }

  // Aliment spécifique : riz, manioc, etc.
  if (has(q, 'je peux manger', 'puis-je manger', 'ai le droit', 'autorise', 'autorisé')) {
    const food = FOODS.find((f) => q.includes(norm(f.name.split(' ')[0]!)) || q.includes(norm(f.id)));
    const name = food ? food.name : 'cet aliment';
    const carby = food && (food.category === 'carb' || food.category === 'dish');
    return reply('can_i_eat', ['low_carb', 'calorie_cycling'], `Oui. Aucun aliment n’est interdit ici, ${name.toLowerCase()} compris. Ce qui compte, c’est la portion et ce qui l’accompagne. ${carby ? `${c.brief.dayType === 'training' ? 'Jour d’entraînement : portion normale, idéalement autour de la séance.' : 'Jour de repos : portion un peu plus petite que d’habitude, et plus de légumes à côté.'} Ajoute toujours une source de protéines.` : 'Intègre-le simplement dans la structure du repas : protéines, légumes, et une portion de glucides adaptée au jour.'} La question n’est jamais « est-ce que j’ai le droit » mais « comment je le place ».`);
  }

  // Pas de poulet / substitution
  if (has(q, 'pas de poulet', 'plus de poulet', 'remplacer le poulet', 'a la place du poulet', 'pas de poisson', 'pas d oeuf', 'remplacer')) {
    const alts = FOODS.filter((f) => f.category === 'protein' && !['chicken_breast', 'chicken_thigh', 'whey'].includes(f.id) && (f.cultures === 'all' || f.cultures.some((cu) => p.foodCultures.includes(cu)))).slice(0, 5);
    return reply('substitute', ['protein_intake'], `Pas de problème : l’objectif est la protéine, pas l’aliment. Équivalents pour une portion : ${alts.map((a) => `${a.name.toLowerCase()} (~${Math.round((30 / a.per100.p) * 100 / 10) * 10} g)`).join(', ')}. Les légumineuses (haricots, lentilles) marchent aussi en doublant la portion et en gardant un peu moins de féculent à côté.`);
  }

  // Quoi manger ce soir / aujourd'hui
  if (has(q, 'je mange quoi', 'quoi manger', 'qu est-ce que je mange', 'qu est ce que je mange', 'ce soir', 'diner', 'dîner', 'dejeuner', 'déjeuner', 'petit dej', 'petit-dej')) {
    const wantsDinner = has(q, 'ce soir', 'diner', 'dîner');
    const wantsLunch = has(q, 'dejeuner', 'déjeuner', 'midi');
    const wantsBreakfast = has(q, 'petit dej', 'petit-dej', 'matin');
    const meal = c.dayPlan.meals.find((m) => (wantsDinner ? m.id === 'dinner' : wantsLunch ? m.id === 'lunch' : wantsBreakfast ? m.id === 'breakfast' : false)) ?? c.dayPlan.meals[c.dayPlan.meals.length - 1]!;
    const items = simple ? meal.simple : meal.items.map((i) => `${i.name.toLowerCase()} ${i.grams} g`).join(', ');
    const alt = meal.items.find((i) => i.role === 'protein')?.alternatives[0];
    const dish = p.foodCultures.includes('west_africa') ? TRADITIONAL_DISHES[2] : null;
    const habitual = dish ? adaptHabitualDish(dish.id, 'rice_white', c.nutrition, meal.share) : null;
    return reply('what_to_eat', [c.nutrition.explanation.evidenceId, 'protein_distribution'], `${meal.name} (${c.brief.dayType === 'training' ? 'jour d’entraînement' : 'jour de repos'}) : ${items}.${alt ? ` Alternative : ${alt.name.toLowerCase()} ${alt.grams} g.` : ''}${meal.tip ? ' ' + meal.tip : ''}${habitual ? ` Tu préfères ton plat habituel ? ${dish!.name} : ${habitual.lines.slice(0, 2).join(' ')}` : ''}`);
  }

  // Jeûne
  if (has(q, 'jeune', 'jeûne', 'fasting', '16/8', 'sauter le petit')) {
    const f = c.fasting;
    return reply('fasting', ['time_restricted_eating'], `${f.reasons.join(' ')}${f.suggestedWindow ? ` Fenêtre suggérée si tu veux essayer : ${f.suggestedWindow}.` : ''} Niveau de preuve : probable que ce n’est pas supérieur à une alimentation structurée à apports égaux. C’est un outil de confort, pas un levier magique.`);
  }

  // Pourquoi (why engine)
  if (has(q, 'pourquoi')) {
    const e = c.nutrition.explanation;
    const evd = EVIDENCE[e.evidenceId];
    if (has(q, 'glucide', 'glucides', 'riz', 'feculent', 'féculent')) {
      const ce = EVIDENCE.carbs_around_training;
      return reply('why_carbs', ['carbs_around_training', 'calorie_cycling'], `${c.brief.dayType === 'training' ? 'Jour d’entraînement : plus de glucides parce qu’ils soutiennent la qualité de la séance et la récupération, et que ce jour est à maintenance.' : 'Jour de repos : moins de glucides parce que la dépense est plus faible et que le déficit léger se fait ce jour-là.'} ${ce.summary} Niveau de preuve : ${levelLabel(ce.level)}.`);
    }
    if (has(q, 'proteine', 'protéine')) {
      const pe = EVIDENCE.protein_intake;
      return reply('why_protein', ['protein_intake'], `Ta cible est ${c.nutrition.proteinG} g (${c.nutrition.proteinPerKg} g/kg). ${pe.summary} Niveau de preuve : ${levelLabel(pe.level)}.`);
    }
    return reply('why', [e.evidenceId], `${e.context} ${e.logic} Bénéfice attendu : ${e.expectedBenefit} Niveau de preuve : ${levelLabel(evd.level)} (${evd.title}).`);
  }

  // Score / où j'en suis
  if (has(q, 'ou j en suis', 'où j en suis', 'bilan', 'progres', 'progrès', 'ca avance', 'ça avance', 'resultat', 'résultat', 'score')) {
    const r = c.review;
    return reply('status', ['waist_marker', 'weight_noise'], `${c.bcs.headline} Score de composition : ${c.bcs.score}/100, vitalité ${c.vitality.score}/10. Cette semaine : ${r.headline} Ce qui fonctionne : ${r.works.map((w) => w.text).join(' ') || 'on accumule les données.'} ${r.keep.length ? 'Ce qu’on ne change pas : ' + r.keep[0]!.text : ''}`);
  }

  // Photos
  if (has(q, 'photo', 'masse grasse', 'pourcentage de gras', '% de gras')) {
    return reply('photos', ['photo_bodyfat'], `Je ne donne pas de pourcentage de masse grasse à partir d’une photo : aucune méthode photo n’est assez fiable pour un chiffre individuel, et un faux chiffre ferait plus de mal que de bien. Ce que les photos permettent : comparer deux clichés pris dans les mêmes conditions (lumière, distance, posture, heure) et observer la définition, la taille abdominale, la posture. Combinées à ton tour de taille et à ta force, elles racontent la vraie histoire.`);
  }

  // Défaut
  return reply('default', ['recomposition_feasibility'], `Je n’ai pas de réponse toute faite à ça, mais voici où tu en es : ${c.bcs.headline} Aujourd’hui : ${c.brief.topThree.join(' ')} Tu peux me demander : « je mange quoi ce soir ? », « j’ai raté ma séance », « je suis invité au restaurant », « j’ai très faim », « je pars 5 jours », « je peux manger du riz ? », « je suis fatigué, je m’entraîne ? », « mon poids ne bouge plus ».`);
}

function reply(intent: string, evidenceIds: EvidenceId[], text: string): CoachReply {
  return { text, evidenceIds, intent, deterministic: true };
}

function levelLabel(l: string): string {
  return ({ solid: 'solide', probable: 'probable', uncertain: 'incertain', approach: 'approche' } as Record<string, string>)[l] ?? l;
}
