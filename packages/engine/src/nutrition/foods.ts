import type { FoodCulture } from '../types';

export type FoodCategory = 'protein' | 'carb' | 'veg' | 'fat' | 'fruit' | 'dairy' | 'legume' | 'dish' | 'drink';

export interface Macros {
  kcal: number;
  p: number; // protéines g
  c: number; // glucides g
  f: number; // lipides g
  fiber: number;
}

export interface Food {
  id: string;
  name: string;
  category: FoodCategory;
  cultures: FoodCulture[] | 'all';
  /** valeurs approximatives pour 100 g tel que consommé (cuit si pertinent) */
  per100: Macros;
  /** portion usuelle en g */
  serving: number;
  tags: string[]; // 'pork','fish','meat','dairy','gluten','nuts','vegetarian','vegan','halal_ok'
  note?: string;
}

const W: FoodCulture[] = ['west_africa'];
const EU: FoodCulture[] = ['europe'];
const MG: FoodCulture[] = ['maghreb', 'middle_east'];

/**
 * Base alimentaire internationale. Valeurs ≈ par 100 g (sources type USDA / Ciqual / tables FAO Afrique de l'Ouest),
 * arrondies. L'utilisateur peut corriger une valeur ; le moteur est tolérant à ±10 %.
 */
export const FOODS: Food[] = [
  // ---- Protéines ----
  { id: 'chicken_breast', name: 'Blanc de poulet (cuit)', category: 'protein', cultures: 'all', per100: { kcal: 165, p: 31, c: 0, f: 3.6, fiber: 0 }, serving: 150, tags: ['meat', 'halal_ok'] },
  { id: 'chicken_thigh', name: 'Cuisse de poulet sans peau (cuite)', category: 'protein', cultures: 'all', per100: { kcal: 180, p: 25, c: 0, f: 8, fiber: 0 }, serving: 150, tags: ['meat', 'halal_ok'] },
  { id: 'beef_lean', name: 'Bœuf maigre (cuit)', category: 'protein', cultures: 'all', per100: { kcal: 190, p: 29, c: 0, f: 8, fiber: 0 }, serving: 140, tags: ['meat', 'halal_ok'] },
  { id: 'eggs', name: 'Œufs', category: 'protein', cultures: 'all', per100: { kcal: 143, p: 12.5, c: 1, f: 10, fiber: 0 }, serving: 120, tags: ['vegetarian'], note: '1 œuf ≈ 55–60 g' },
  { id: 'tilapia', name: 'Tilapia / carpe (cuit)', category: 'protein', cultures: 'all', per100: { kcal: 128, p: 26, c: 0, f: 2.7, fiber: 0 }, serving: 160, tags: ['fish', 'halal_ok'] },
  { id: 'mackerel', name: 'Maquereau (cuit ou braisé)', category: 'protein', cultures: 'all', per100: { kcal: 230, p: 24, c: 0, f: 15, fiber: 0 }, serving: 140, tags: ['fish', 'halal_ok'] },
  { id: 'sardines', name: 'Sardines', category: 'protein', cultures: 'all', per100: { kcal: 208, p: 25, c: 0, f: 11, fiber: 0 }, serving: 100, tags: ['fish', 'halal_ok'] },
  { id: 'smoked_fish', name: 'Poisson fumé', category: 'protein', cultures: W, per100: { kcal: 180, p: 32, c: 0, f: 5, fiber: 0 }, serving: 80, tags: ['fish', 'halal_ok'] },
  { id: 'salmon', name: 'Saumon (cuit)', category: 'protein', cultures: EU, per100: { kcal: 206, p: 22, c: 0, f: 13, fiber: 0 }, serving: 140, tags: ['fish'] },
  { id: 'tuna_can', name: 'Thon en boîte (au naturel)', category: 'protein', cultures: 'all', per100: { kcal: 116, p: 26, c: 0, f: 1, fiber: 0 }, serving: 120, tags: ['fish', 'halal_ok'] },
  { id: 'shrimp', name: 'Crevettes (cuites)', category: 'protein', cultures: 'all', per100: { kcal: 99, p: 24, c: 0, f: 0.3, fiber: 0 }, serving: 150, tags: ['fish'] },
  { id: 'lamb', name: 'Agneau / mouton (cuit, maigre)', category: 'protein', cultures: [...MG, 'west_africa'], per100: { kcal: 230, p: 26, c: 0, f: 14, fiber: 0 }, serving: 130, tags: ['meat', 'halal_ok'] },
  { id: 'tofu', name: 'Tofu ferme', category: 'protein', cultures: 'all', per100: { kcal: 145, p: 16, c: 3, f: 9, fiber: 1 }, serving: 180, tags: ['vegan', 'vegetarian', 'halal_ok'] },
  { id: 'greek_yogurt', name: 'Yaourt grec / skyr nature', category: 'dairy', cultures: 'all', per100: { kcal: 60, p: 10, c: 4, f: 0.5, fiber: 0 }, serving: 200, tags: ['dairy', 'vegetarian'] },
  { id: 'cottage', name: 'Fromage blanc 3 %', category: 'dairy', cultures: EU, per100: { kcal: 72, p: 8, c: 4, f: 3, fiber: 0 }, serving: 200, tags: ['dairy', 'vegetarian'] },
  { id: 'whey', name: 'Protéine en poudre (whey ou végétale)', category: 'protein', cultures: 'all', per100: { kcal: 380, p: 78, c: 7, f: 5, fiber: 0 }, serving: 30, tags: ['supplement', 'vegetarian'], note: 'Optionnel : un aliment pratique, pas une obligation.' },
  // ---- Légumineuses (protéines + glucides) ----
  { id: 'beans_cooked', name: 'Haricots (niébé, rouges) cuits', category: 'legume', cultures: 'all', per100: { kcal: 127, p: 8.7, c: 22, f: 0.5, fiber: 6.4 }, serving: 200, tags: ['vegan', 'vegetarian', 'halal_ok'] },
  { id: 'lentils', name: 'Lentilles cuites', category: 'legume', cultures: 'all', per100: { kcal: 116, p: 9, c: 20, f: 0.4, fiber: 7.9 }, serving: 200, tags: ['vegan', 'vegetarian', 'halal_ok'] },
  { id: 'chickpeas', name: 'Pois chiches cuits', category: 'legume', cultures: 'all', per100: { kcal: 164, p: 8.9, c: 27, f: 2.6, fiber: 7.6 }, serving: 180, tags: ['vegan', 'vegetarian', 'halal_ok'] },
  // ---- Glucides ----
  { id: 'rice_white', name: 'Riz blanc cuit', category: 'carb', cultures: 'all', per100: { kcal: 130, p: 2.7, c: 28, f: 0.3, fiber: 0.4 }, serving: 200, tags: ['vegan', 'halal_ok'] },
  { id: 'rice_brown', name: 'Riz complet cuit', category: 'carb', cultures: 'all', per100: { kcal: 123, p: 2.7, c: 26, f: 1, fiber: 1.8 }, serving: 200, tags: ['vegan', 'halal_ok'] },
  { id: 'attieke', name: 'Attiéké (semoule de manioc)', category: 'carb', cultures: W, per100: { kcal: 160, p: 1.5, c: 36, f: 0.5, fiber: 2 }, serving: 200, tags: ['vegan', 'halal_ok'] },
  { id: 'yam_boiled', name: 'Igname bouillie', category: 'carb', cultures: W, per100: { kcal: 116, p: 1.5, c: 27, f: 0.1, fiber: 3.9 }, serving: 250, tags: ['vegan', 'halal_ok'] },
  { id: 'cassava_boiled', name: 'Manioc bouilli', category: 'carb', cultures: W, per100: { kcal: 160, p: 1.4, c: 38, f: 0.3, fiber: 1.8 }, serving: 200, tags: ['vegan', 'halal_ok'] },
  { id: 'foutou', name: 'Foutou / foufou (igname ou banane)', category: 'carb', cultures: W, per100: { kcal: 150, p: 1.5, c: 35, f: 0.3, fiber: 2 }, serving: 250, tags: ['vegan', 'halal_ok'] },
  { id: 'plantain_boiled', name: 'Banane plantain bouillie', category: 'carb', cultures: W, per100: { kcal: 116, p: 0.8, c: 31, f: 0.2, fiber: 2.3 }, serving: 200, tags: ['vegan', 'halal_ok'] },
  { id: 'alloco', name: 'Alloco (plantain frit)', category: 'carb', cultures: W, per100: { kcal: 250, p: 1, c: 38, f: 11, fiber: 2 }, serving: 150, tags: ['vegan', 'halal_ok'], note: 'Version plaisir : réduire la portion plutôt que supprimer.' },
  { id: 'sweet_potato', name: 'Patate douce cuite', category: 'carb', cultures: 'all', per100: { kcal: 90, p: 2, c: 21, f: 0.1, fiber: 3.3 }, serving: 250, tags: ['vegan', 'halal_ok'] },
  { id: 'potato', name: 'Pomme de terre cuite', category: 'carb', cultures: 'all', per100: { kcal: 87, p: 1.9, c: 20, f: 0.1, fiber: 1.8 }, serving: 250, tags: ['vegan', 'halal_ok'] },
  { id: 'maize_porridge', name: 'Bouillie / pâte de maïs (tô, akassa)', category: 'carb', cultures: W, per100: { kcal: 110, p: 2.3, c: 24, f: 0.6, fiber: 1.5 }, serving: 300, tags: ['vegan', 'halal_ok'] },
  { id: 'millet_couscous', name: 'Couscous de mil / fonio cuit', category: 'carb', cultures: [...W, 'maghreb'], per100: { kcal: 120, p: 3.5, c: 25, f: 1, fiber: 2.5 }, serving: 200, tags: ['vegan', 'halal_ok'] },
  { id: 'couscous', name: 'Couscous de blé cuit', category: 'carb', cultures: MG, per100: { kcal: 112, p: 3.8, c: 23, f: 0.2, fiber: 1.4 }, serving: 200, tags: ['vegan', 'gluten', 'halal_ok'] },
  { id: 'oats', name: 'Flocons d’avoine (secs)', category: 'carb', cultures: 'all', per100: { kcal: 370, p: 13, c: 60, f: 7, fiber: 10 }, serving: 60, tags: ['vegan', 'halal_ok'] },
  { id: 'bread_whole', name: 'Pain complet', category: 'carb', cultures: 'all', per100: { kcal: 250, p: 9, c: 43, f: 3.5, fiber: 7 }, serving: 80, tags: ['vegan', 'gluten', 'halal_ok'] },
  { id: 'pasta', name: 'Pâtes cuites', category: 'carb', cultures: EU, per100: { kcal: 158, p: 5.8, c: 31, f: 0.9, fiber: 1.8 }, serving: 220, tags: ['vegan', 'gluten', 'halal_ok'] },
  { id: 'quinoa', name: 'Quinoa cuit', category: 'carb', cultures: EU, per100: { kcal: 120, p: 4.4, c: 21, f: 1.9, fiber: 2.8 }, serving: 200, tags: ['vegan', 'halal_ok'] },
  // ---- Légumes ----
  { id: 'leafy_greens', name: 'Feuilles vertes (épinards, feuilles de patate, gboma…)', category: 'veg', cultures: 'all', per100: { kcal: 30, p: 3, c: 3, f: 0.4, fiber: 2.5 }, serving: 150, tags: ['vegan', 'halal_ok'] },
  { id: 'okra', name: 'Gombo', category: 'veg', cultures: [...W, 'south_asia', 'middle_east'], per100: { kcal: 33, p: 1.9, c: 7, f: 0.2, fiber: 3.2 }, serving: 150, tags: ['vegan', 'halal_ok'] },
  { id: 'tomato_onion', name: 'Tomates, oignons, poivrons', category: 'veg', cultures: 'all', per100: { kcal: 28, p: 1, c: 6, f: 0.2, fiber: 1.5 }, serving: 150, tags: ['vegan', 'halal_ok'] },
  { id: 'cabbage', name: 'Chou / brocoli', category: 'veg', cultures: 'all', per100: { kcal: 30, p: 2.5, c: 5, f: 0.3, fiber: 2.6 }, serving: 150, tags: ['vegan', 'halal_ok'] },
  { id: 'eggplant', name: 'Aubergine (y c. aubergine africaine)', category: 'veg', cultures: 'all', per100: { kcal: 25, p: 1, c: 6, f: 0.2, fiber: 3 }, serving: 150, tags: ['vegan', 'halal_ok'] },
  { id: 'mixed_salad', name: 'Salade composée (crudités)', category: 'veg', cultures: 'all', per100: { kcal: 20, p: 1.2, c: 3.5, f: 0.2, fiber: 1.8 }, serving: 150, tags: ['vegan', 'halal_ok'] },
  { id: 'green_beans', name: 'Haricots verts', category: 'veg', cultures: 'all', per100: { kcal: 31, p: 1.8, c: 7, f: 0.2, fiber: 2.7 }, serving: 150, tags: ['vegan', 'halal_ok'] },
  { id: 'carrots', name: 'Carottes / courgettes', category: 'veg', cultures: 'all', per100: { kcal: 30, p: 0.9, c: 7, f: 0.2, fiber: 2.5 }, serving: 150, tags: ['vegan', 'halal_ok'] },
  // ---- Lipides ----
  { id: 'peanuts', name: 'Arachides / pâte d’arachide', category: 'fat', cultures: 'all', per100: { kcal: 590, p: 25, c: 16, f: 50, fiber: 8 }, serving: 25, tags: ['nuts', 'vegan', 'halal_ok'] },
  { id: 'avocado', name: 'Avocat', category: 'fat', cultures: 'all', per100: { kcal: 160, p: 2, c: 9, f: 15, fiber: 7 }, serving: 80, tags: ['vegan', 'halal_ok'] },
  { id: 'olive_oil', name: 'Huile d’olive', category: 'fat', cultures: 'all', per100: { kcal: 884, p: 0, c: 0, f: 100, fiber: 0 }, serving: 10, tags: ['vegan', 'halal_ok'] },
  { id: 'palm_oil', name: 'Huile de palme rouge', category: 'fat', cultures: W, per100: { kcal: 884, p: 0, c: 0, f: 100, fiber: 0 }, serving: 10, tags: ['vegan', 'halal_ok'], note: 'Riche en graisses saturées : quantité à mesurer, pas à bannir.' },
  { id: 'nuts_mix', name: 'Amandes / noix de cajou', category: 'fat', cultures: 'all', per100: { kcal: 600, p: 20, c: 20, f: 50, fiber: 8 }, serving: 25, tags: ['nuts', 'vegan', 'halal_ok'] },
  { id: 'seeds', name: 'Graines (courge, sésame, lin)', category: 'fat', cultures: 'all', per100: { kcal: 560, p: 25, c: 15, f: 45, fiber: 8 }, serving: 20, tags: ['vegan', 'halal_ok'] },
  // ---- Fruits ----
  { id: 'banana', name: 'Banane', category: 'fruit', cultures: 'all', per100: { kcal: 89, p: 1.1, c: 23, f: 0.3, fiber: 2.6 }, serving: 120, tags: ['vegan', 'halal_ok'] },
  { id: 'mango', name: 'Mangue', category: 'fruit', cultures: 'all', per100: { kcal: 60, p: 0.8, c: 15, f: 0.4, fiber: 1.6 }, serving: 150, tags: ['vegan', 'halal_ok'] },
  { id: 'papaya', name: 'Papaye', category: 'fruit', cultures: W, per100: { kcal: 43, p: 0.5, c: 11, f: 0.3, fiber: 1.7 }, serving: 200, tags: ['vegan', 'halal_ok'] },
  { id: 'pineapple', name: 'Ananas', category: 'fruit', cultures: 'all', per100: { kcal: 50, p: 0.5, c: 13, f: 0.1, fiber: 1.4 }, serving: 150, tags: ['vegan', 'halal_ok'] },
  { id: 'orange', name: 'Orange / agrumes', category: 'fruit', cultures: 'all', per100: { kcal: 47, p: 0.9, c: 12, f: 0.1, fiber: 2.4 }, serving: 150, tags: ['vegan', 'halal_ok'] },
  { id: 'apple', name: 'Pomme / poire', category: 'fruit', cultures: 'all', per100: { kcal: 52, p: 0.3, c: 14, f: 0.2, fiber: 2.4 }, serving: 150, tags: ['vegan', 'halal_ok'] },
  { id: 'berries', name: 'Fruits rouges', category: 'fruit', cultures: EU, per100: { kcal: 45, p: 1, c: 10, f: 0.3, fiber: 3 }, serving: 120, tags: ['vegan', 'halal_ok'] },
  // ---- Plats traditionnels (approximations par 100 g de plat servi) ----
  { id: 'sauce_arachide', name: 'Sauce arachide (mafé) avec viande', category: 'dish', cultures: W, per100: { kcal: 180, p: 10, c: 6, f: 13, fiber: 2 }, serving: 250, tags: ['nuts', 'meat', 'halal_ok'], note: 'Riche en lipides : la louche compte autant que le riz.' },
  { id: 'sauce_graine', name: 'Sauce graine (noix de palme) avec poisson', category: 'dish', cultures: W, per100: { kcal: 170, p: 9, c: 5, f: 13, fiber: 2 }, serving: 250, tags: ['fish', 'halal_ok'] },
  { id: 'sauce_feuille', name: 'Sauce feuilles (gboma, épinards) avec poisson fumé', category: 'dish', cultures: W, per100: { kcal: 95, p: 9, c: 4, f: 5, fiber: 3 }, serving: 250, tags: ['fish', 'halal_ok'], note: 'Excellente densité protéines/fibres pour la recomposition.' },
  { id: 'sauce_tomate_poisson', name: 'Sauce tomate / poisson braisé', category: 'dish', cultures: W, per100: { kcal: 110, p: 14, c: 5, f: 4, fiber: 1.5 }, serving: 250, tags: ['fish', 'halal_ok'] },
  { id: 'thieboudienne', name: 'Thiéboudienne (riz au poisson, portion complète)', category: 'dish', cultures: W, per100: { kcal: 150, p: 8, c: 20, f: 5, fiber: 1.5 }, serving: 400, tags: ['fish', 'halal_ok'] },
  { id: 'jollof', name: 'Riz jollof / riz gras', category: 'dish', cultures: W, per100: { kcal: 165, p: 3.5, c: 28, f: 5, fiber: 1 }, serving: 300, tags: ['vegan', 'halal_ok'], note: 'Un plat glucidique : ajouter une vraie source de protéines à côté.' },
  { id: 'tagine', name: 'Tajine viande + légumes', category: 'dish', cultures: MG, per100: { kcal: 120, p: 10, c: 7, f: 6, fiber: 2 }, serving: 300, tags: ['meat', 'halal_ok'] },
  { id: 'shakshuka', name: 'Chakchouka aux œufs', category: 'dish', cultures: MG, per100: { kcal: 95, p: 6, c: 6, f: 6, fiber: 2 }, serving: 300, tags: ['vegetarian', 'halal_ok'] },
  // ---- Boissons ----
  { id: 'bissap', name: 'Bissap / jus de gingembre (sucré)', category: 'drink', cultures: W, per100: { kcal: 45, p: 0, c: 11, f: 0, fiber: 0 }, serving: 250, tags: ['vegan', 'halal_ok'], note: 'Le sucre liquide compte : version peu sucrée ou portion réduite.' },
  { id: 'milk', name: 'Lait demi-écrémé', category: 'drink', cultures: 'all', per100: { kcal: 46, p: 3.3, c: 4.8, f: 1.6, fiber: 0 }, serving: 250, tags: ['dairy', 'vegetarian'] },
];

export const FOOD_BY_ID: Record<string, Food> = Object.fromEntries(FOODS.map((f) => [f.id, f]));

export function foodsFor(culture: FoodCulture[], category: FoodCategory, exclude: (f: Food) => boolean = () => false): Food[] {
  const inCulture = (f: Food) => f.cultures === 'all' || f.cultures.some((c) => culture.includes(c));
  const primary = FOODS.filter((f) => f.category === category && inCulture(f) && !exclude(f));
  if (primary.length >= 2) return primary;
  return FOODS.filter((f) => f.category === category && !exclude(f));
}

export function macrosFor(food: Food, grams: number): Macros {
  const k = grams / 100;
  return {
    kcal: Math.round(food.per100.kcal * k),
    p: Math.round(food.per100.p * k * 10) / 10,
    c: Math.round(food.per100.c * k * 10) / 10,
    f: Math.round(food.per100.f * k * 10) / 10,
    fiber: Math.round(food.per100.fiber * k * 10) / 10,
  };
}

/** Exclusions à partir des préférences/allergies déclarées. */
export function buildExclusion(prefs: string[], allergies: string[], disliked: string[]): (f: Food) => boolean {
  const p = new Set(prefs.map((s) => s.toLowerCase()));
  const a = new Set(allergies.map((s) => s.toLowerCase()));
  const d = new Set(disliked.map((s) => s.toLowerCase()));
  return (f) => {
    if (d.has(f.id) || d.has(f.name.toLowerCase())) return true;
    if (p.has('vegetarian') && (f.tags.includes('meat') || f.tags.includes('fish'))) return true;
    if (p.has('vegan') && !f.tags.includes('vegan')) return true;
    if (p.has('no_pork') && f.tags.includes('pork')) return true;
    if (p.has('halal') && !(f.tags.includes('halal_ok') || f.tags.includes('vegetarian'))) return true;
    if (p.has('lactose_free') && f.tags.includes('dairy')) return true;
    if (p.has('gluten_free') && f.tags.includes('gluten')) return true;
    if (p.has('no_fish') && f.tags.includes('fish')) return true;
    if (a.has('nuts') && f.tags.includes('nuts')) return true;
    if (a.has('dairy') && f.tags.includes('dairy')) return true;
    if (a.has('gluten') && f.tags.includes('gluten')) return true;
    if (a.has('fish') && f.tags.includes('fish')) return true;
    if (a.has('eggs') && f.id === 'eggs') return true;
    return false;
  };
}
