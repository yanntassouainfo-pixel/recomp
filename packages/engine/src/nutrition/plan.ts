import type { FoodCulture, Profile } from '../types';
import { FOODS, FOOD_BY_ID, buildExclusion, foodsFor, macrosFor, type Food, type Macros } from './foods';
import type { NutritionTargets } from './targets';

export interface MealItem {
  foodId: string;
  name: string;
  grams: number;
  macros: Macros;
  alternatives: { foodId: string; name: string; grams: number }[];
  role: 'protein' | 'carb' | 'veg' | 'fat' | 'fruit' | 'dish';
}

export interface Meal {
  id: string;
  name: string;
  /** idée de repas nommée (template), ex. « Poisson braisé, attiéké, salade » */
  title: string;
  timing: string;
  share: number; // part des kcal du jour
  items: MealItem[];
  macros: Macros;
  simple: string; // description en portions-main
  tip?: string;
}

export interface PlateProportions {
  protein: number;
  veg: number;
  carbs: number;
  fat: number;
  label: string;
}

export interface DayPlan {
  meals: Meal[];
  totals: Macros;
  plate: PlateProportions;
  hydration: string;
  structure: string;
}

/* ------------------------------------------------------------------ IDÉES DE REPAS */

export interface MealTemplate {
  id: string;
  kind: 'breakfast' | 'main' | 'snack';
  title: string;
  cultures: FoodCulture[] | 'all';
  /** aliments par rôle ; le solveur dimensionne les grammes */
  protein?: string;
  carb?: string;
  veg?: string;
  fat?: string;
  fruit?: string;
  /** plat traditionnel qui porte protéines + lipides (remplace protein/fat) */
  dish?: string;
  tip?: string;
}

const WA: FoodCulture[] = ['west_africa'];
export const MEAL_TEMPLATES: MealTemplate[] = [
  // Petits déjeuners
  { id: 'b_eggs_bread', kind: 'breakfast', title: 'Œufs brouillés, pain complet, avocat', cultures: 'all', protein: 'eggs', carb: 'bread_whole', fat: 'avocado', fruit: 'orange' },
  { id: 'b_oats_skyr', kind: 'breakfast', title: 'Porridge d’avoine, skyr, fruits rouges, graines', cultures: ['europe'], protein: 'skyr', carb: 'oats', fat: 'seeds', fruit: 'berries' },
  { id: 'b_yogurt_granola', kind: 'breakfast', title: 'Yaourt grec, muesli, banane, amandes', cultures: ['europe', 'middle_east'], protein: 'greek_yogurt', carb: 'granola_plain', fat: 'nuts_mix', fruit: 'banana' },
  { id: 'b_millet_porridge', kind: 'breakfast', title: 'Bouillie de mil, yaourt, banane, arachides', cultures: WA, protein: 'greek_yogurt', carb: 'sorghum_porridge', fat: 'peanuts', fruit: 'banana' },
  { id: 'b_omelette_plantain', kind: 'breakfast', title: 'Omelette aux légumes, plantain bouilli, papaye', cultures: WA, protein: 'eggs', carb: 'plantain_boiled', veg: 'tomato_onion', fruit: 'papaya' },
  { id: 'b_beans_bread', kind: 'breakfast', title: 'Haricots niébé, œuf, pain, mangue', cultures: WA, protein: 'eggs', carb: 'black_eyed_peas', fruit: 'mango', fat: 'palm_oil' },
  { id: 'b_shakshuka', kind: 'breakfast', title: 'Chakchouka aux œufs, pain pita, dattes', cultures: ['maghreb', 'middle_east'], protein: 'eggs', carb: 'pita', veg: 'tomato_onion', fruit: 'dates' },
  { id: 'b_cottage_fruit', kind: 'breakfast', title: 'Fromage blanc, flocons d’avoine, pomme, purée d’amande', cultures: ['europe'], protein: 'cottage', carb: 'oats', fat: 'almond_butter', fruit: 'apple' },
  { id: 'b_tofu_scramble', kind: 'breakfast', title: 'Tofu brouillé, pain complet, avocat, kiwi', cultures: 'all', protein: 'tofu', carb: 'bread_whole', fat: 'avocado', fruit: 'kiwi' },
  { id: 'b_whey_oats', kind: 'breakfast', title: 'Overnight oats à la protéine, banane, graines', cultures: 'all', protein: 'whey', carb: 'oats', fat: 'seeds', fruit: 'banana' },
  { id: 'b_chapati_eggs', kind: 'breakfast', title: 'Chapati, œufs, épinards, goyave', cultures: ['south_asia', 'west_africa'], protein: 'eggs', carb: 'chapati', veg: 'spinach', fruit: 'guava' },
  // Déjeuners / dîners
  { id: 'm_braised_fish_attieke', kind: 'main', title: 'Poisson braisé, attiéké, salade tomate-oignon', cultures: WA, protein: 'tilapia', carb: 'attieke', veg: 'tomato_onion', fat: 'olive_oil' },
  { id: 'm_yassa', kind: 'main', title: 'Poulet yassa, riz, crudités', cultures: WA, dish: 'yassa', carb: 'rice_white', veg: 'mixed_salad' },
  { id: 'm_mafe', kind: 'main', title: 'Mafé (sauce arachide), riz, légumes', cultures: WA, dish: 'sauce_arachide', carb: 'rice_white', veg: 'cabbage' },
  { id: 'm_sauce_feuille', kind: 'main', title: 'Sauce feuilles au poisson fumé, foutou', cultures: WA, dish: 'sauce_feuille', carb: 'foutou', veg: 'okra' },
  { id: 'm_okra', kind: 'main', title: 'Sauce gombo, tô de maïs, poisson', cultures: WA, dish: 'okra_soup', carb: 'maize_porridge', protein: 'smoked_fish' },
  { id: 'm_ndole', kind: 'main', title: 'Ndolé, plantain bouilli', cultures: WA, dish: 'ndole', carb: 'plantain_boiled', veg: 'cucumber_tomato' },
  { id: 'm_thiebou', kind: 'main', title: 'Thiéboudienne, portion recomposition', cultures: WA, dish: 'thieboudienne', veg: 'mixed_salad' },
  { id: 'm_egusi', kind: 'main', title: 'Sauce egusi, igname bouillie', cultures: WA, dish: 'egusi', carb: 'yam_boiled', veg: 'spinach' },
  { id: 'm_fonio_chicken', kind: 'main', title: 'Poulet grillé, fonio, légumes sautés', cultures: WA, protein: 'chicken_thigh', carb: 'fonio', veg: 'green_beans', fat: 'olive_oil' },
  { id: 'm_beans_plantain', kind: 'main', title: 'Haricots rouges, plantain, œufs', cultures: WA, protein: 'eggs', carb: 'beans_cooked', veg: 'tomato_onion', fat: 'palm_oil' },
  { id: 'm_chicken_rice_bowl', kind: 'main', title: 'Bowl poulet, riz complet, légumes, avocat', cultures: 'all', protein: 'chicken_breast', carb: 'rice_brown', veg: 'carrots', fat: 'avocado' },
  { id: 'm_salmon_quinoa', kind: 'main', title: 'Saumon, quinoa, brocoli', cultures: ['europe'], protein: 'salmon', carb: 'quinoa', veg: 'cabbage' },
  { id: 'm_beef_sweetpotato', kind: 'main', title: 'Bœuf haché, patate douce, haricots verts', cultures: 'all', protein: 'beef_mince_lean', carb: 'sweet_potato', veg: 'green_beans', fat: 'olive_oil' },
  { id: 'm_bolognese', kind: 'main', title: 'Pâtes bolognaise, salade', cultures: ['europe'], dish: 'bolognese', carb: 'pasta', veg: 'mixed_salad' },
  { id: 'm_omelette_potato', kind: 'main', title: 'Omelette champignons, pommes de terre, salade', cultures: 'all', protein: 'eggs', carb: 'potato', veg: 'mushrooms', fat: 'olive_oil' },
  { id: 'm_tagine', kind: 'main', title: 'Tajine, boulgour, concombre-tomate', cultures: ['maghreb', 'middle_east'], dish: 'tagine', carb: 'bulgur', veg: 'cucumber_tomato' },
  { id: 'm_couscous', kind: 'main', title: 'Couscous aux légumes et viande', cultures: ['maghreb'], dish: 'couscous_royal', carb: 'couscous', veg: 'ratatouille' },
  { id: 'm_harira', kind: 'main', title: 'Harira, pain pita, œufs', cultures: ['maghreb', 'middle_east'], dish: 'soup_lentil', carb: 'pita', protein: 'eggs' },
  { id: 'm_chickpea_tahini', kind: 'main', title: 'Pois chiches, tahini, pita, crudités', cultures: ['middle_east', 'maghreb'], protein: 'chickpeas', carb: 'pita', veg: 'cucumber_tomato', fat: 'tahini' },
  { id: 'm_dal', kind: 'main', title: 'Dal de lentilles, riz, épinards', cultures: ['south_asia', 'middle_east'], dish: 'red_lentils_dal', carb: 'rice_white', veg: 'spinach', protein: 'paneer' },
  { id: 'm_curry', kind: 'main', title: 'Curry de poulet, riz, chou-fleur', cultures: ['south_asia', 'east_asia'], dish: 'chicken_curry', carb: 'rice_white', veg: 'cauliflower' },
  { id: 'm_stir_fry', kind: 'main', title: 'Wok bœuf-légumes, nouilles de riz', cultures: ['east_asia'], dish: 'stir_fry', carb: 'rice_noodles', veg: 'bok_choy' },
  { id: 'm_poke', kind: 'main', title: 'Poke bowl saumon, riz, edamame', cultures: ['east_asia', 'europe'], dish: 'poke_bowl', carb: 'rice_white', veg: 'edamame' },
  { id: 'm_chili', kind: 'main', title: 'Chili con carne, tortillas, salade', cultures: ['latin_america', 'europe'], dish: 'chili', carb: 'corn_tortilla', veg: 'mixed_salad' },
  { id: 'm_black_beans', kind: 'main', title: 'Haricots noirs, riz, œufs, avocat', cultures: ['latin_america'], protein: 'eggs', carb: 'black_beans', veg: 'tomato_onion', fat: 'avocado' },
  { id: 'm_cod_potato', kind: 'main', title: 'Cabillaud, pommes de terre, ratatouille', cultures: ['europe'], protein: 'cod', carb: 'potato', veg: 'ratatouille', fat: 'olive_oil' },
  { id: 'm_turkey_bulgur', kind: 'main', title: 'Dinde, boulgour, courge rôtie', cultures: 'all', protein: 'turkey', carb: 'bulgur', veg: 'pumpkin', fat: 'olive_oil' },
  { id: 'm_tofu_buckwheat', kind: 'main', title: 'Tofu sauté, sarrasin, pak choï', cultures: 'all', protein: 'tofu', carb: 'buckwheat', veg: 'bok_choy', fat: 'seeds' },
  { id: 'm_tempeh_rice', kind: 'main', title: 'Tempeh, riz complet, légumes sautés', cultures: 'all', protein: 'tempeh', carb: 'rice_brown', veg: 'carrots' },
  { id: 'm_sardines_salad', kind: 'main', title: 'Sardines, pommes de terre, salade, olives', cultures: ['europe', 'maghreb'], protein: 'sardines', carb: 'potato', veg: 'mixed_salad', fat: 'olives' },
  { id: 'm_shrimp_rice', kind: 'main', title: 'Crevettes sautées, riz, courgettes', cultures: 'all', protein: 'shrimp', carb: 'rice_white', veg: 'carrots', fat: 'olive_oil' },
  { id: 'm_goat_yam', kind: 'main', title: 'Cabri grillé, igname, salade', cultures: WA, protein: 'goat', carb: 'yam_boiled', veg: 'mixed_salad', fat: 'peanuts' },
  { id: 'm_mackerel_gari', kind: 'main', title: 'Maquereau braisé, gari, salade de chou', cultures: WA, protein: 'mackerel', carb: 'gari', veg: 'cabbage' },
  // Collations
  { id: 's_skyr_fruit', kind: 'snack', title: 'Skyr, fruit, noix', cultures: 'all', protein: 'skyr', fruit: 'apple', fat: 'nuts_mix' },
  { id: 's_yogurt_dates', kind: 'snack', title: 'Yaourt, dattes, amandes', cultures: ['maghreb', 'middle_east', 'west_africa'], protein: 'greek_yogurt', fruit: 'dates', fat: 'nuts_mix' },
  { id: 's_whey_banana', kind: 'snack', title: 'Shake protéiné, banane', cultures: 'all', protein: 'whey', fruit: 'banana' },
  { id: 's_eggs_fruit', kind: 'snack', title: 'Œufs durs, fruit', cultures: 'all', protein: 'eggs', fruit: 'orange' },
  { id: 's_tuna_bread', kind: 'snack', title: 'Thon, pain complet, concombre', cultures: 'all', protein: 'tuna_can', carb: 'bread_whole', veg: 'cucumber_tomato' },
  { id: 's_cottage_choc', kind: 'snack', title: 'Fromage blanc, fruits rouges, chocolat noir', cultures: ['europe'], protein: 'cottage', fruit: 'berries', fat: 'dark_chocolate' },
  { id: 's_peanuts_fruit', kind: 'snack', title: 'Arachides grillées, mangue, lait', cultures: WA, protein: 'milk', fruit: 'mango', fat: 'peanuts' },
  { id: 's_soy_yogurt', kind: 'snack', title: 'Yaourt de soja, kiwi, graines', cultures: 'all', protein: 'soy_yogurt', fruit: 'kiwi', fat: 'seeds' },
];

/** Templates compatibles avec les cultures et les exclusions. */
export function templatesFor(kind: MealTemplate['kind'], cultures: FoodCulture[], exclude: (f: Food) => boolean): MealTemplate[] {
  const okCulture = (t: MealTemplate) => t.cultures === 'all' || t.cultures.some((c) => cultures.includes(c));
  const okFoods = (t: MealTemplate) => [t.protein, t.carb, t.veg, t.fat, t.fruit, t.dish].filter(Boolean).every((id) => FOOD_BY_ID[id!] && !exclude(FOOD_BY_ID[id!]!));
  const primary = MEAL_TEMPLATES.filter((t) => t.kind === kind && okCulture(t) && okFoods(t));
  if (primary.length >= 4) return primary;
  return MEAL_TEMPLATES.filter((t) => t.kind === kind && okFoods(t));
}

/**
 * Rotation déterministe : jour → template, sans reprendre celui de la veille ni celui d'un autre repas du jour ;
 * `variant` permet « une autre idée ».
 */
function rotate<T extends { id: string }>(pool: T[], dayIndex: number, slotIndex: number, variant: number, avoid: Set<string>): T | null {
  if (pool.length === 0) return null;
  const n = pool.length;
  // un pas premier avec n pour balayer tout le pool au fil des jours
  const step = [7, 5, 11, 3, 13][slotIndex % 5]!;
  // ordre du jour pour ce créneau, puis on retire les idées à éviter ; `variant` avance dans cet ordre
  const order: T[] = [];
  for (let k = 0; k < n; k++) {
    const t = pool[((dayIndex * step + slotIndex * 3 + k) % n + n) % n]!;
    if (!avoid.has(t.id) && !order.includes(t)) order.push(t);
  }
  if (order.length === 0) return pool[((dayIndex + variant) % n + n) % n]!;
  return order[((variant % order.length) + order.length) % order.length]!;
}

function roundGrams(g: number, step = 10): number {
  return Math.max(step, Math.round(g / step) * step);
}

function sum(ms: Macros[]): Macros {
  return ms.reduce((a, m) => ({ kcal: a.kcal + m.kcal, p: a.p + m.p, c: a.c + m.c, f: a.f + m.f, fiber: a.fiber + m.fiber }), { kcal: 0, p: 0, c: 0, f: 0, fiber: 0 });
}

function pick<T>(arr: T[], i: number): T {
  return arr[((i % arr.length) + arr.length) % arr.length]!;
}

export function plateFor(targets: NutritionTargets): PlateProportions {
  if (targets.dayType === 'training') return { protein: 0.3, veg: 0.3, carbs: 0.3, fat: 0.1, label: 'Assiette jour d’entraînement' };
  return { protein: 0.3, veg: 0.45, carbs: 0.15, fat: 0.1, label: 'Assiette jour de repos' };
}

/**
 * Construit un plan de repas concret à partir des cibles.
 * Algorithme : légumes fixes → protéines pour atteindre la cible du repas → glucides pour compléter → lipides pour compléter.
 */
export function buildDayPlan(targets: NutritionTargets, profile: Profile, seed = 0, variants: Record<string, number> = {}): DayPlan {
  const exclude = buildExclusion(profile.dietaryPreferences, profile.allergies, profile.dislikedFoods);
  const cultures = profile.foodCultures.length ? profile.foodCultures : ['europe' as const];
  // Idées de la veille à éviter (même rotation, jour précédent)
  const usedYesterday = new Set<string>();
  const pools = { breakfast: templatesFor('breakfast', cultures, exclude), main: templatesFor('main', cultures, exclude), snack: templatesFor('snack', cultures, exclude) };
  // Le déjeuner vient de la cuisine principale (première culture déclarée) quand elle offre assez d'idées.
  const homeMain = templatesFor('main', [cultures[0]!], exclude).filter((t) => t.cultures !== 'all' && t.cultures.includes(cultures[0]!));
  const lunchPool = homeMain.length >= 4 ? homeMain : pools.main;
  ['breakfast', 'lunch', 'dinner', 'snack', 'snack1'].forEach((id, i) => {
    const kind = id === 'breakfast' ? 'breakfast' : id.startsWith('snack') ? 'snack' : 'main';
    const t = rotate(id === 'lunch' ? lunchPool : pools[kind], seed - 1, i, 0, new Set());
    if (t) usedYesterday.add(t.id);
  });
  const usedToday = new Set<string>();
  const proteins = foodsFor(cultures, 'protein', exclude).filter((f) => f.id !== 'whey');
  const dairy = foodsFor(cultures, 'dairy', exclude);
  const carbs = foodsFor(cultures, 'carb', exclude).filter((f) => !['alloco', 'jollof'].includes(f.id));
  const vegs = foodsFor(cultures, 'veg', exclude);
  const fats = foodsFor(cultures, 'fat', exclude);
  const fruits = foodsFor(cultures, 'fruit', exclude);
  const legumes = foodsFor(cultures, 'legume', exclude);

  const n = profile.mealsPerDay;
  const training = targets.dayType === 'training';
  const t = profile.trainingTimeOfDay;

  // Répartition énergétique par repas, biaisée autour de la séance.
  type Slot = { id: string; name: string; timing: string; share: number; carbBias: number; kind: 'breakfast' | 'lunch' | 'snack' | 'dinner' };
  let slots: Slot[] = [];
  if (n === 3) {
    slots = [
      { id: 'breakfast', name: 'Petit déjeuner', timing: 'Matin', share: 0.28, carbBias: 1, kind: 'breakfast' },
      { id: 'lunch', name: 'Déjeuner', timing: 'Midi', share: 0.37, carbBias: 1, kind: 'lunch' },
      { id: 'dinner', name: 'Dîner', timing: 'Soir', share: 0.35, carbBias: 1, kind: 'dinner' },
    ];
  } else if (n === 4) {
    slots = [
      { id: 'breakfast', name: 'Petit déjeuner', timing: 'Matin', share: 0.25, carbBias: 1, kind: 'breakfast' },
      { id: 'lunch', name: 'Déjeuner', timing: 'Midi', share: 0.33, carbBias: 1, kind: 'lunch' },
      { id: 'snack', name: 'Collation', timing: 'Après-midi', share: 0.12, carbBias: 1, kind: 'snack' },
      { id: 'dinner', name: 'Dîner', timing: 'Soir', share: 0.30, carbBias: 1, kind: 'dinner' },
    ];
  } else {
    slots = [
      { id: 'breakfast', name: 'Petit déjeuner', timing: 'Matin', share: 0.22, carbBias: 1, kind: 'breakfast' },
      { id: 'snack1', name: 'Collation matin', timing: 'Matinée', share: 0.1, carbBias: 1, kind: 'snack' },
      { id: 'lunch', name: 'Déjeuner', timing: 'Midi', share: 0.3, carbBias: 1, kind: 'lunch' },
      { id: 'snack', name: 'Collation', timing: 'Après-midi', share: 0.1, carbBias: 1, kind: 'snack' },
      { id: 'dinner', name: 'Dîner', timing: 'Soir', share: 0.28, carbBias: 1, kind: 'dinner' },
    ];
  }
  if (training) {
    // glucides biaisés vers les repas encadrant la séance
    const around: Record<typeof t, string[]> = { morning: ['breakfast', 'lunch'], midday: ['breakfast', 'lunch', 'snack'], evening: ['snack', 'dinner', 'lunch'] };
    for (const s of slots) s.carbBias = around[t].includes(s.id) ? 1.4 : 0.7;
  }
  const biasTotal = slots.reduce((a, s) => a + s.share * s.carbBias, 0);

  const meals: Meal[] = slots.map((slot, i) => {
    const mealP = targets.proteinG / n; // protéines réparties à parts égales
    const mealC = (targets.carbsG * slot.share * slot.carbBias) / biasTotal;
    const mealF = targets.fatG * slot.share;
    const items: MealItem[] = [];
    const others = () => sum(items.map((x) => x.macros));
    const kind = slot.kind === 'breakfast' ? 'breakfast' : slot.kind === 'snack' ? 'snack' : 'main';
    const variant = variants[slot.id] ?? 0;
    const tpl = rotate(slot.id === 'lunch' ? lunchPool : pools[kind], seed, i, variant, new Set([...usedYesterday, ...usedToday]));
    if (tpl) usedToday.add(tpl.id);

    if (tpl) {
      // --- repas depuis une idée nommée : légumes → glucides → lipides/plat → protéines dimensionnées en dernier
      const F = (id?: string) => (id ? FOOD_BY_ID[id] : undefined);
      const veg = F(tpl.veg); const carb = F(tpl.carb); const fat = F(tpl.fat); const fruit = F(tpl.fruit); const dish = F(tpl.dish); const prot = F(tpl.protein);
      if (veg) items.push(item(veg, slot.kind === 'breakfast' ? 100 : 180, 'veg', vegs.filter((f) => f.id !== veg.id).slice(0, 3)));
      if (fruit) items.push(item(fruit, fruit.serving, 'fruit', fruits.filter((f) => f.id !== fruit.id).slice(0, 2)));
      if (dish) {
        // le plat porte une part des protéines et des lipides : portion bornée par les lipides du repas
        const byFat = mealF * 0.8 / (dish.per100.f / 100);
        const byProt = mealP * 0.7 / (dish.per100.p / 100);
        items.push(item(dish, roundGrams(Math.min(dish.serving * 1.4, byFat, byProt), 25), 'dish', TRADITIONAL_DISHES.filter((d) => d.id !== dish.id && !exclude(d)).slice(0, 3)));
      }
      if (carb) {
        const cNeeded = mealC - others().c;
        if (cNeeded > 10) items.push(item(carb, roundGrams(cNeeded / (carb.per100.c / 100), carb.category === 'legume' ? 50 : 20), 'carb', carbs.filter((f) => f.id !== carb.id && !['oats', 'bread_whole'].includes(f.id)).slice(0, 3), undefined, cNeeded));
        const remaining = mealC - others().c;
        if (remaining > 30) {
          // plafond atteint : complément par un second glucide simple (fruit ou pain), jamais un second plat
          const extra = kind === 'breakfast' ? (fruit ? FOOD_BY_ID.bread_whole : FOOD_BY_ID.banana) : (slot.kind === 'dinner' ? FOOD_BY_ID.banana : FOOD_BY_ID.bread_whole);
          if (extra && !exclude(extra) && !items.some((x) => x.foodId === extra.id)) items.push(item(extra, roundGrams(remaining / (extra.per100.c / 100), 10), extra.category === 'fruit' ? 'fruit' : 'carb', [], undefined, remaining));
        }
      }
      if (fat) {
        const fNeeded = mealF - others().f - (prot ? (prot.per100.f * Math.max(10, mealP - others().p)) / prot.per100.p : 0);
        if (fNeeded > 4) items.push(item(fat, Math.min(40, roundGrams(fNeeded / (fat.per100.f / 100), 5)), 'fat', fats.filter((f) => f.id !== fat.id).slice(0, 2)));
      }
      if (prot) {
        const pNeeded = Math.max(10, mealP - others().p);
        items.push(item(prot, roundGrams(pNeeded / (prot.per100.p / 100), prot.id === 'eggs' ? 55 : prot.id === 'whey' ? 5 : 10), 'protein', proteins.filter((f) => f.id !== prot.id).slice(0, 3), pNeeded));
        const shortfall = mealP - others().p;
        if (shortfall > 12) {
          const second = (kind === 'breakfast' || kind === 'snack' ? [...dairy, FOOD_BY_ID.whey!, FOOD_BY_ID.eggs!] : [...proteins.filter((f) => f.per100.f <= 8), ...dairy]).find((f) => f && f.id !== prot.id && !exclude(f));
          if (second) items.push(item(second, roundGrams(shortfall / (second.per100.p / 100), second.id === 'eggs' ? 55 : second.id === 'whey' ? 5 : 10), 'protein', [], shortfall));
        }
      } else if (dish) {
        const shortfall = mealP - others().p;
        if (shortfall > 10) {
          const second = proteins.find((f) => f.per100.f <= 8 && !exclude(f)) ?? FOOD_BY_ID.eggs!;
          items.push(item(second, roundGrams(shortfall / (second.per100.p / 100), 10), 'protein', [], shortfall));
        }
      }
      items.sort((a, b) => order(a.role) - order(b.role));
      const macros = sum(items.map((x) => x.macros));
      const tip = tpl.tip ?? (slot.kind === 'dinner' && training && t === 'evening' ? 'Repas post-séance : protéines + glucides, c’est le bon moment.' : slot.kind === 'lunch' && training && t === 'midday' ? 'Séance proche : garde ce repas digeste, 1 h 30 avant ou juste après.' : undefined);
      return { id: slot.id, name: slot.name, title: tpl.title, timing: slot.timing, share: slot.share, items, macros, simple: describeSimple(items), tip };
    }

    // Principe : on place d'abord légumes, glucides et lipides, puis on dimensionne la source de protéines
    // pour atteindre la cible du repas en tenant compte des protéines incidentes (légumineuses, avoine, laitages...).
    if (slot.kind === 'breakfast') {
      const cSrc = pick(carbs.filter((f) => ['oats', 'bread_whole', 'maize_porridge', 'plantain_boiled', 'sweet_potato'].includes(f.id)).concat(carbs).slice(0, 4), seed + i);
      if (mealC > 15) items.push(item(cSrc, roundGrams((mealC * 0.75) / (cSrc.per100.c / 100), cSrc.id === 'oats' ? 10 : 20), 'carb', carbs.filter((f) => f.id !== cSrc.id).slice(0, 3), undefined, mealC * 0.75));
      const fr = pick(fruits, seed + i);
      items.push(item(fr, fr.serving, 'fruit', fruits.filter((f) => f.id !== fr.id).slice(0, 2)));
      const pSrc = pick([...dairy, ...(FOOD_BY_ID.eggs && !exclude(FOOD_BY_ID.eggs) ? [FOOD_BY_ID.eggs] : [])], seed + i);
      const fatSoFar = others().f;
      const fatNeeded = mealF - fatSoFar - (pSrc.id === 'eggs' ? mealP * 0.8 : 0) * 0; // lipides des œufs comptés après
      if (fatNeeded > 6 && pSrc.id !== 'eggs') {
        const fs = pick(fats.filter((f) => ['peanuts', 'nuts_mix', 'seeds', 'avocado'].includes(f.id)).concat(fats), seed + i);
        items.push(item(fs, Math.min(40, roundGrams(fatNeeded / (fs.per100.f / 100), 5)), 'fat', fats.filter((f) => f.id !== fs.id).slice(0, 2)));
      }
      const pNeeded = Math.max(10, mealP - others().p);
      items.push(item(pSrc, roundGrams(pNeeded / (pSrc.per100.p / 100), pSrc.id === 'eggs' ? 55 : 50), 'protein', [pSrc.id === 'eggs' ? dairy[0] : FOOD_BY_ID.eggs, FOOD_BY_ID.whey].filter((f): f is Food => Boolean(f) && f!.id !== pSrc.id), pNeeded));
      const bShort = mealP - others().p;
      if (bShort > 10) {
        const second = pSrc.id === 'eggs' ? dairy[0] ?? FOOD_BY_ID.whey! : !exclude(FOOD_BY_ID.eggs!) ? FOOD_BY_ID.eggs! : FOOD_BY_ID.whey!;
        if (second && !exclude(second)) items.push(item(second, roundGrams(bShort / (second.per100.p / 100), second.id === 'eggs' ? 55 : second.id === 'whey' ? 5 : 50), 'protein', [], bShort));
      }
    } else if (slot.kind === 'snack') {
      const fr = pick(fruits, seed + i + 1);
      items.push(item(fr, fr.serving, 'fruit', fruits.filter((f) => f.id !== fr.id).slice(0, 2)));
      if (mealC > 30) {
        const cSrc = pick(carbs.filter((f) => ['bread_whole', 'oats', 'plantain_boiled'].includes(f.id)).concat(carbs), seed + i);
        items.push(item(cSrc, roundGrams(((mealC - others().c) * 0.8) / (cSrc.per100.c / 100), 10), 'carb', []));
      }
      const fatNeeded = mealF - others().f;
      if (fatNeeded > 6) {
        const fs = pick(fats.filter((f) => f.id !== 'olive_oil' && f.id !== 'palm_oil'), seed + i);
        items.push(item(fs, Math.min(30, roundGrams(fatNeeded / (fs.per100.f / 100), 5)), 'fat', []));
      }
      const pSrc = pick([...dairy, ...proteins.filter((f) => ['tuna_can', 'eggs'].includes(f.id)), FOOD_BY_ID.whey!].filter(Boolean), seed + i);
      const pNeeded = Math.max(10, mealP - others().p);
      let pG = roundGrams(pNeeded / (pSrc.per100.p / 100), pSrc.id === 'whey' ? 5 : 50);
      if (pSrc.category === 'dairy' && pG > 300) {
        pG = 250;
        items.push(item(pSrc, pG, 'protein', dairy.filter((f) => f.id !== pSrc.id).slice(0, 2), pNeeded));
        const rest = pNeeded - items[items.length - 1]!.macros.p;
        if (rest > 8 && !exclude(FOOD_BY_ID.whey!)) items.push(item(FOOD_BY_ID.whey!, roundGrams(rest / 0.78, 5), 'protein', [], rest));
      } else {
        items.push(item(pSrc, pG, 'protein', dairy.concat([FOOD_BY_ID.whey!]).filter((f) => f.id !== pSrc.id).slice(0, 2), pNeeded));
      }
    } else {
      // déjeuner / dîner : légumes → glucides (légumineuse plafonnée) → lipides → protéines dimensionnées en dernier
      const veg = pick(vegs, seed + i);
      items.push(item(veg, 180, 'veg', vegs.filter((f) => f.id !== veg.id).slice(0, 3)));
      const cNeeded = mealC - others().c;
      if (cNeeded > 15) {
        const useLegume = legumes.length > 0 && (seed + i) % 3 === 0;
        if (useLegume) {
          const leg = pick(legumes, seed + i);
          const legG = Math.min(250, roundGrams(cNeeded / (leg.per100.c / 100), 50));
          items.push(item(leg, legG, 'carb', carbs.filter((f) => !['oats', 'bread_whole'].includes(f.id)).slice(0, 3), undefined, cNeeded));
          const remaining = mealC - others().c;
          if (remaining > 20) {
            const cSrc = pick(carbs.filter((f) => !['oats', 'bread_whole'].includes(f.id)), seed + i + 1);
            items.push(item(cSrc, roundGrams(remaining / (cSrc.per100.c / 100), 20), 'carb', carbs.filter((f) => f.id !== cSrc.id && !['oats', 'bread_whole'].includes(f.id)).slice(0, 3), undefined, remaining));
          }
        } else {
          const cSrc = pick(carbs.filter((f) => !['oats', 'bread_whole'].includes(f.id)), seed + i);
          items.push(item(cSrc, roundGrams(cNeeded / (cSrc.per100.c / 100), 20), 'carb', carbs.filter((f) => f.id !== cSrc.id && !['oats', 'bread_whole'].includes(f.id)).slice(0, 3), undefined, cNeeded));
        }
      } else {
        items[0] = item(veg, 250, 'veg', vegs.filter((f) => f.id !== veg.id).slice(0, 3)); // plus de volume
      }
      const fatBudget = mealF - others().f;
      const pool = proteins.filter((f) => f.id !== 'eggs');
      const leanPool = pool.filter((f) => f.per100.f <= 6);
      const pSrc = pick(fatBudget < 18 && leanPool.length ? leanPool : pool, seed + i + (slot.kind === 'dinner' ? 1 : 0));
      // lipides : on anticipe ceux de la source de protéines (≈ sa part pour la cible protéique)
      const pNeededEst = Math.max(15, mealP - others().p);
      const pGramsEst = pNeededEst / (pSrc.per100.p / 100);
      const fatNeeded = mealF - others().f - (pSrc.per100.f * pGramsEst) / 100;
      if (fatNeeded > 4) {
        const fs = pick(fats.filter((f) => ['olive_oil', 'avocado', 'peanuts', 'palm_oil'].includes(f.id)).concat(fats), seed + i);
        items.push(item(fs, Math.min(40, roundGrams(fatNeeded / (fs.per100.f / 100), 5)), 'fat', fats.filter((f) => f.id !== fs.id).slice(0, 2)));
      }
      const pNeeded = Math.max(15, mealP - others().p);
      items.push(item(pSrc, roundGrams(pNeeded / (pSrc.per100.p / 100), 10), 'protein', proteins.filter((f) => f.id !== pSrc.id && f.id !== 'eggs').slice(0, 3), pNeeded));
      const shortfall = mealP - others().p;
      if (shortfall > 12) {
        const second = pool.find((f) => f.id !== pSrc.id && f.per100.f <= 8) ?? FOOD_BY_ID.eggs!;
        if (second && !exclude(second)) items.push(item(second, roundGrams(shortfall / (second.per100.p / 100), 10), 'protein', [], shortfall));
      }
      // ordre d'affichage : protéines, légumes, glucides, lipides
      items.sort((a, b) => order(a.role) - order(b.role));
    }

    const macros = sum(items.map((x) => x.macros));
    const simple = describeSimple(items);
    const tip = slot.kind === 'dinner' && training && t === 'evening' ? 'Repas post-séance : protéines + glucides, c’est le bon moment.' : slot.kind === 'lunch' && training && t === 'midday' ? 'Séance proche : garde ce repas digeste, 1 h 30 avant ou juste après.' : undefined;
    return { id: slot.id, name: slot.name, title: items.filter((x) => x.role === 'protein' || x.role === 'carb').map((x) => x.name.split(' (')[0]).join(', '), timing: slot.timing, share: slot.share, items, macros, simple, tip };
  });

  const totals = sum(meals.map((m) => m.macros));
  return {
    meals,
    totals,
    plate: plateFor(targets),
    hydration: `${(targets.waterMl / 1000).toFixed(1)} L sur la journée (≈ ${targets.simple.waterGlasses} verres)${training ? ', dont 0,5 L autour de la séance' : ''}.`,
    structure: `${n} repas · une source de protéines à chaque repas · légumes au déjeuner et au dîner · glucides ${training ? 'autour de la séance' : 'modérés, surtout le soir si la faim est là'}.`,
  };
}

function order(role: MealItem['role']): number {
  return { protein: 0, veg: 1, carb: 2, fat: 3, fruit: 4, dish: 5 }[role];
}

/** Bornes de plausibilité (g tel que consommé) : ce qui tient dans une assiette. */
const BOUNDS: Record<MealItem['role'], [number, number]> = { protein: 60, carb: 60, veg: 100, fat: 5, fruit: 80, dish: 150 } as unknown as Record<MealItem['role'], [number, number]>;
const MAX_G: Record<string, number> = { gari: 200, attieke: 300, cassava_boiled: 250, foutou: 300, alloco: 150, chapati: 160, pita: 160, corn_tortilla: 160, granola_plain: 80, dates: 60, eggs: 220, whey: 40, greek_yogurt: 300, cottage: 300, tofu: 250, oats: 100, bread_whole: 150, peanuts: 50, nuts_mix: 50, seeds: 40, avocado: 150, olive_oil: 30, palm_oil: 25 };
const ROLE_MAX: Record<MealItem['role'], number> = { protein: 250, carb: 350, veg: 400, fat: 60, fruit: 300, dish: 500 };
const ROLE_MIN: Record<MealItem['role'], number> = { protein: 60, carb: 60, veg: 100, fat: 5, fruit: 80, dish: 150 };
void BOUNDS;

const MIN_G: Record<string, number> = { whey: 15, eggs: 55, egg_whites: 60, peanuts: 10, nuts_mix: 10, seeds: 10, tahini: 10, almond_butter: 10, olive_oil: 5, palm_oil: 5, dates: 20, dark_chocolate: 10, feta: 20 };

function clampGrams(food: Food, grams: number, role: MealItem['role']): number {
  const max = Math.min(ROLE_MAX[role], MAX_G[food.id] ?? Infinity);
  const min = MIN_G[food.id] ?? ROLE_MIN[role];
  return Math.max(min, Math.min(max, grams));
}

function item(food: Food, grams: number, role: MealItem['role'], alts: Food[], targetProtein?: number, targetCarbs?: number): MealItem {
  grams = clampGrams(food, grams, role);
  return {
    foodId: food.id,
    name: food.name,
    grams,
    macros: macrosFor(food, grams),
    role,
    alternatives: alts.slice(0, 3).map((a) => ({
      foodId: a.id,
      name: a.name,
      grams: clampGrams(a, targetProtein ? roundGrams(targetProtein / (a.per100.p / 100), 10) : targetCarbs ? roundGrams(targetCarbs / (a.per100.c / 100), 10) : a.serving, role),
    })),
  };
}

function describeSimple(items: MealItem[]): string {
  const parts: string[] = [];
  for (const it of items) {
    if (it.role === 'protein') parts.push(`${Math.max(1, Math.round(it.macros.p / 28))} paume${it.macros.p >= 42 ? 's' : ''} de ${it.name.toLowerCase()}`);
    if (it.role === 'carb') parts.push(`${Math.max(1, Math.round(it.macros.c / 35))} poing${it.macros.c >= 52 ? 's' : ''} de ${it.name.toLowerCase()}`);
    if (it.role === 'veg') parts.push(`${it.grams >= 220 ? '2 poings' : '1 poing'} de ${it.name.toLowerCase()}`);
    if (it.role === 'fat') parts.push(`${Math.max(1, Math.round(it.macros.f / 10))} pouce${it.macros.f >= 15 ? 's' : ''} de ${it.name.toLowerCase()}`);
    if (it.role === 'fruit') parts.push(`1 fruit (${it.name.toLowerCase()})`);
    if (it.role === 'dish') parts.push(`${Math.max(1, Math.round(it.grams / 125))} louche${it.grams >= 250 ? 's' : ''} de ${it.name.toLowerCase().split(' (')[0]}`);
  }
  return parts.join(' · ');
}

/**
 * « Tu peux manger ton plat habituel. » Ajuste un plat traditionnel aux cibles d'un repas.
 */
export function adaptHabitualDish(dishId: string, carbId: string | null, targets: NutritionTargets, mealShare = 0.35): { lines: string[]; macros: Macros } | null {
  const dish = FOOD_BY_ID[dishId];
  if (!dish) return null;
  const mealKcal = targets.kcal * mealShare;
  const mealP = targets.proteinG / 3;
  const lines: string[] = [];
  let dishG = dish.serving;
  let dishM = macrosFor(dish, dishG);
  // ajuster la portion de sauce/plat pour ne pas dépasser ~60 % des kcal du repas si plat gras
  if (dishM.kcal > mealKcal * 0.6) {
    dishG = roundGrams((mealKcal * 0.6) / (dish.per100.kcal / 100), 25);
    dishM = macrosFor(dish, dishG);
    lines.push(`${dish.name} : vise environ ${dishG} g (≈ ${Math.round(dishG / 125)} louche${dishG >= 250 ? 's' : ''}) — la sauce est riche, c’est elle qui fait la différence.`);
  } else {
    lines.push(`${dish.name} : ta portion habituelle (~${dishG} g) convient.`);
  }
  const missingP = mealP - dishM.p;
  const all: Macros[] = [dishM];
  if (missingP > 8) {
    const extra = roundGrams(missingP / 0.26, 20);
    lines.push(`Ajoute ~${extra} g de poisson, poulet ou œufs (ou double la part de viande/poisson dans la sauce) pour atteindre tes protéines.`);
    all.push({ kcal: Math.round(extra * 1.4), p: Math.round(extra * 0.26), c: 0, f: Math.round(extra * 0.04), fiber: 0 });
  }
  if (carbId) {
    const carb = FOOD_BY_ID[carbId];
    if (carb) {
      const remaining = mealKcal - all.reduce((a, m) => a + m.kcal, 0);
      const carbG = roundGrams(Math.max(100, remaining / (carb.per100.kcal / 100)), 25);
      const cm = macrosFor(carb, carbG);
      all.push(cm);
      lines.push(`${carb.name} : environ ${carbG} g cuit${targets.dayType === 'rest' ? ' (jour de repos : portion un peu plus petite que d’habitude)' : ' (jour d’entraînement : portion normale)'}.`);
    }
  }
  lines.push('Ajoute une part de légumes ou de crudités si le plat n’en contient pas : volume, fibres, satiété.');
  return { lines, macros: sum(all) };
}

export const TRADITIONAL_DISHES = FOODS.filter((f) => f.category === 'dish');

/**
 * Remplace un aliment d'un repas par une alternative en conservant le bénéfice principal :
 * même quantité de protéines (protéine, plat), de glucides (glucide), de lipides (lipide), ou même portion (légume, fruit).
 */
export function swapMealItem(meal: Meal, fromFoodId: string, toFoodId: string): Meal {
  const from = meal.items.find((i) => i.foodId === fromFoodId);
  const to = FOOD_BY_ID[toFoodId];
  if (!from || !to) return meal;
  let grams: number;
  if (from.role === 'protein' || from.role === 'dish') grams = to.per100.p > 0 ? (from.macros.p / to.per100.p) * 100 : to.serving;
  else if (from.role === 'carb') grams = to.per100.c > 0 ? (from.macros.c / to.per100.c) * 100 : to.serving;
  else if (from.role === 'fat') grams = to.per100.f > 0 ? (from.macros.f / to.per100.f) * 100 : to.serving;
  else grams = from.grams;
  grams = clampGrams(to, roundGrams(grams, to.id === 'eggs' ? 55 : to.id === 'whey' ? 5 : from.role === 'fat' ? 5 : 10), from.role);
  const alts = [FOOD_BY_ID[fromFoodId]!, ...from.alternatives.map((a) => FOOD_BY_ID[a.foodId]!)].filter((f) => f && f.id !== to.id).slice(0, 3);
  const replaced: MealItem = item(to, grams, from.role, alts, from.role === 'protein' || from.role === 'dish' ? from.macros.p : undefined, from.role === 'carb' ? from.macros.c : undefined);
  const items = meal.items.map((i) => (i.foodId === fromFoodId ? replaced : i));
  const title = meal.title.includes(FOOD_BY_ID[fromFoodId]!.name.split(' (')[0]!) ? meal.title.replace(FOOD_BY_ID[fromFoodId]!.name.split(' (')[0]!, to.name.split(' (')[0]!) : meal.title;
  return { ...meal, title, items, macros: sum(items.map((x) => x.macros)), simple: describeSimple(items) };
}

/** Compare deux repas : vrai si protéines à ±12 % et énergie à ±15 %. */
export function sameBenefits(a: Macros, b: Macros): { equivalent: boolean; dP: number; dKcal: number } {
  const dP = Math.round(b.p - a.p);
  const dKcal = Math.round(b.kcal - a.kcal);
  return { equivalent: Math.abs(dP) <= Math.max(6, a.p * 0.12) && Math.abs(dKcal) <= Math.max(60, a.kcal * 0.15), dP, dKcal };
}

/**
 * Recale un repas sur des apports cibles (celui qu'il remplace) : protéines via la source de protéines,
 * énergie via le glucide puis le lipide. Les bornes d'assiette restent respectées.
 */
export function fitMealTo(meal: Meal, target: Macros): Meal {
  let items: MealItem[] = meal.items.map((i) => ({ ...i }));
  const total = () => sum(items.map((x) => x.macros));
  const foodOf = (it: MealItem) => FOOD_BY_ID[it.foodId]!;
  const maxOf = (it: MealItem) => Math.min(ROLE_MAX[it.role], MAX_G[it.foodId] ?? Infinity);
  const minOf = (it: MealItem) => MIN_G[it.foodId] ?? ROLE_MIN[it.role];
  const setGrams = (idx: number, grams: number) => {
    const it = items[idx]!; const f = foodOf(it);
    const g = clampGrams(f, roundGrams(grams, f.id === 'eggs' ? 55 : f.id === 'whey' ? 5 : it.role === 'fat' ? 5 : 10), it.role);
    items[idx] = { ...it, grams: g, macros: macrosFor(f, g) };
  };
  const hasRoom = (it: MealItem, dir: 1 | -1) => (dir > 0 ? it.grams < maxOf(it) - 1 : it.grams > minOf(it) + 1);

  for (let pass = 0; pass < 3; pass++) {
    // --- protéines : source de protéines, puis plat, puis seconde source
    const diffP = target.p - total().p;
    if (Math.abs(diffP) > 4) {
      const dir: 1 | -1 = diffP > 0 ? 1 : -1;
      const levers = [...items.map((it, i) => ({ it, i })).filter(({ it }) => (it.role === 'protein' || it.role === 'dish') && hasRoom(it, dir))].sort((a, b) => (a.it.role === 'protein' ? -1 : 1) - (b.it.role === 'protein' ? -1 : 1));
      const lever = levers[0];
      if (lever && foodOf(lever.it).per100.p > 0) setGrams(lever.i, lever.it.grams + (diffP / foodOf(lever.it).per100.p) * 100);
      else if (dir < 0) {
        // retirer une seconde source de protéines à sa borne si le reste suffit
        const idx = items.findIndex((it) => it.role === 'protein' && items.filter((x) => x.role === 'protein' || x.role === 'dish').length > 1);
        if (idx >= 0 && total().p - items[idx]!.macros.p >= target.p * 0.88) items.splice(idx, 1);
      }
    }
    // --- énergie : glucide(s), puis complément, puis lipide, puis plat
    const diffK = target.kcal - total().kcal;
    if (Math.abs(diffK) > 50) {
      const dir: 1 | -1 = diffK > 0 ? 1 : -1;
      const carbIdx = items.map((it, i) => ({ it, i })).filter(({ it }) => (it.role === 'carb' || it.role === 'fruit') && hasRoom(it, dir)).map((x) => x.i);
      if (carbIdx.length) {
        const i = carbIdx[0]!;
        setGrams(i, items[i]!.grams + (diffK / foodOf(items[i]!).per100.kcal) * 100);
      } else if (dir > 0 && diffK > 80) {
        const topUp = items.some((it) => it.foodId === 'rice_white') ? FOOD_BY_ID.bread_whole! : FOOD_BY_ID.rice_white!;
        items.push(item(topUp, roundGrams((diffK / topUp.per100.kcal) * 100, 20), 'carb', [], undefined, (diffK / 4)));
      } else {
        const fatI = items.findIndex((it) => it.role === 'fat' && hasRoom(it, dir));
        if (fatI >= 0) setGrams(fatI, items[fatI]!.grams + (diffK / foodOf(items[fatI]!).per100.kcal) * 100);
        else {
          const dishI = items.findIndex((it) => it.role === 'dish' && hasRoom(it, dir));
          if (dishI >= 0) setGrams(dishI, items[dishI]!.grams + (diffK / foodOf(items[dishI]!).per100.kcal) * 100);
        }
      }
    }
  }
  items = items.filter((i) => i.grams > 0).sort((a, b) => order(a.role) - order(b.role));
  return { ...meal, items, macros: total(), simple: describeSimple(items) };
}
