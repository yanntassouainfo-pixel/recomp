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

  // ---- Protéines (suite) ----
  { id: 'turkey', name: 'Dinde (escalope, cuite)', category: 'protein', cultures: 'all', per100: { kcal: 150, p: 30, c: 0, f: 2.5, fiber: 0 }, serving: 150, tags: ['meat', 'halal_ok'] },
  { id: 'beef_mince_lean', name: 'Bœuf haché 5 % (cuit)', category: 'protein', cultures: 'all', per100: { kcal: 170, p: 27, c: 0, f: 6, fiber: 0 }, serving: 140, tags: ['meat', 'halal_ok'] },
  { id: 'goat', name: 'Chèvre / cabri (cuit)', category: 'protein', cultures: ['west_africa', 'maghreb', 'south_asia'], per100: { kcal: 143, p: 27, c: 0, f: 3, fiber: 0 }, serving: 140, tags: ['meat', 'halal_ok'] },
  { id: 'cod', name: 'Cabillaud / colin (cuit)', category: 'protein', cultures: 'all', per100: { kcal: 105, p: 23, c: 0, f: 1, fiber: 0 }, serving: 170, tags: ['fish', 'halal_ok'] },
  { id: 'sole_bar', name: 'Bar / dorade (cuit)', category: 'protein', cultures: 'all', per100: { kcal: 125, p: 24, c: 0, f: 3, fiber: 0 }, serving: 160, tags: ['fish', 'halal_ok'] },
  { id: 'tempeh', name: 'Tempeh', category: 'protein', cultures: 'all', per100: { kcal: 190, p: 19, c: 8, f: 11, fiber: 6 }, serving: 150, tags: ['vegan', 'vegetarian', 'halal_ok'] },
  { id: 'seitan', name: 'Seitan', category: 'protein', cultures: 'all', per100: { kcal: 140, p: 25, c: 5, f: 2, fiber: 1 }, serving: 150, tags: ['vegan', 'vegetarian', 'gluten', 'halal_ok'] },
  { id: 'paneer', name: 'Paneer', category: 'protein', cultures: ['south_asia'], per100: { kcal: 265, p: 18, c: 2, f: 20, fiber: 0 }, serving: 120, tags: ['dairy', 'vegetarian'] },
  { id: 'egg_whites', name: 'Blancs d’œufs', category: 'protein', cultures: 'all', per100: { kcal: 52, p: 11, c: 0.7, f: 0.2, fiber: 0 }, serving: 150, tags: ['vegetarian'] },
  { id: 'canned_mackerel', name: 'Maquereau en boîte (égoutté)', category: 'protein', cultures: 'all', per100: { kcal: 200, p: 24, c: 0, f: 12, fiber: 0 }, serving: 110, tags: ['fish', 'halal_ok'] },
  { id: 'liver', name: 'Foie de volaille (cuit)', category: 'protein', cultures: 'all', per100: { kcal: 165, p: 25, c: 1, f: 6, fiber: 0 }, serving: 120, tags: ['meat', 'halal_ok'], note: 'Très riche en fer et vitamine A : une fois par semaine suffit.' },
  { id: 'skyr', name: 'Skyr nature', category: 'dairy', cultures: 'all', per100: { kcal: 63, p: 11, c: 4, f: 0.2, fiber: 0 }, serving: 200, tags: ['dairy', 'vegetarian'] },
  { id: 'soy_yogurt', name: 'Yaourt de soja nature', category: 'dairy', cultures: 'all', per100: { kcal: 50, p: 4, c: 2, f: 2.5, fiber: 1 }, serving: 200, tags: ['vegan', 'vegetarian', 'halal_ok'] },
  { id: 'feta', name: 'Feta', category: 'dairy', cultures: ['europe', 'middle_east', 'maghreb'], per100: { kcal: 265, p: 14, c: 4, f: 21, fiber: 0 }, serving: 40, tags: ['dairy', 'vegetarian'] },
  // ---- Légumineuses (suite) ----
  { id: 'black_eyed_peas', name: 'Niébé (haricots à œil noir) cuit', category: 'legume', cultures: ['west_africa'], per100: { kcal: 116, p: 8, c: 21, f: 0.5, fiber: 6.5 }, serving: 200, tags: ['vegan', 'vegetarian', 'halal_ok'] },
  { id: 'red_lentils_dal', name: 'Dal de lentilles corail', category: 'legume', cultures: ['south_asia', 'middle_east'], per100: { kcal: 120, p: 8, c: 17, f: 2.5, fiber: 5 }, serving: 250, tags: ['vegan', 'vegetarian', 'halal_ok'] },
  { id: 'edamame', name: 'Edamame', category: 'legume', cultures: ['east_asia'], per100: { kcal: 120, p: 11, c: 9, f: 5, fiber: 5 }, serving: 150, tags: ['vegan', 'vegetarian', 'halal_ok'] },
  // ---- Glucides (suite) ----
  { id: 'bulgur', name: 'Boulgour cuit', category: 'carb', cultures: ['middle_east', 'maghreb', 'europe'], per100: { kcal: 83, p: 3, c: 19, f: 0.2, fiber: 4.5 }, serving: 200, tags: ['vegan', 'gluten', 'halal_ok'] },
  { id: 'fonio', name: 'Fonio cuit', category: 'carb', cultures: ['west_africa'], per100: { kcal: 115, p: 2.5, c: 25, f: 0.5, fiber: 1.5 }, serving: 200, tags: ['vegan', 'halal_ok'] },
  { id: 'gari', name: 'Gari (semoule de manioc)', category: 'carb', cultures: ['west_africa'], per100: { kcal: 160, p: 1, c: 38, f: 0.5, fiber: 2 }, serving: 150, tags: ['vegan', 'halal_ok'] },
  { id: 'rice_noodles', name: 'Nouilles de riz cuites', category: 'carb', cultures: ['east_asia'], per100: { kcal: 110, p: 1.8, c: 25, f: 0.2, fiber: 1 }, serving: 200, tags: ['vegan', 'halal_ok'] },
  { id: 'chapati', name: 'Chapati / pain plat complet', category: 'carb', cultures: ['south_asia', 'west_africa'], per100: { kcal: 280, p: 9, c: 48, f: 6, fiber: 6 }, serving: 80, tags: ['vegan', 'gluten', 'halal_ok'] },
  { id: 'pita', name: 'Pain pita complet', category: 'carb', cultures: ['middle_east', 'maghreb', 'europe'], per100: { kcal: 260, p: 10, c: 50, f: 2.5, fiber: 6 }, serving: 80, tags: ['vegan', 'gluten', 'halal_ok'] },
  { id: 'corn_tortilla', name: 'Tortillas de maïs', category: 'carb', cultures: ['latin_america'], per100: { kcal: 220, p: 5.7, c: 45, f: 2.8, fiber: 6 }, serving: 80, tags: ['vegan', 'halal_ok'] },
  { id: 'sorghum_porridge', name: 'Bouillie de sorgho / mil', category: 'carb', cultures: ['west_africa'], per100: { kcal: 95, p: 2.5, c: 20, f: 1, fiber: 2 }, serving: 300, tags: ['vegan', 'halal_ok'] },
  { id: 'granola_plain', name: 'Muesli sans sucre ajouté', category: 'carb', cultures: ['europe'], per100: { kcal: 370, p: 10, c: 60, f: 8, fiber: 9 }, serving: 60, tags: ['vegan', 'gluten', 'halal_ok'] },
  { id: 'buckwheat', name: 'Sarrasin cuit', category: 'carb', cultures: ['europe', 'east_asia'], per100: { kcal: 92, p: 3.4, c: 20, f: 0.6, fiber: 2.7 }, serving: 200, tags: ['vegan', 'halal_ok'] },
  { id: 'black_beans', name: 'Haricots noirs cuits', category: 'legume', cultures: ['latin_america'], per100: { kcal: 132, p: 8.9, c: 24, f: 0.5, fiber: 8.7 }, serving: 200, tags: ['vegan', 'vegetarian', 'halal_ok'] },
  // ---- Légumes (suite) ----
  { id: 'spinach', name: 'Épinards', category: 'veg', cultures: 'all', per100: { kcal: 23, p: 2.9, c: 3.6, f: 0.4, fiber: 2.2 }, serving: 150, tags: ['vegan', 'halal_ok'] },
  { id: 'cassava_leaves', name: 'Feuilles de manioc / ndolé (cuit, sans huile)', category: 'veg', cultures: ['west_africa'], per100: { kcal: 60, p: 5, c: 8, f: 1.5, fiber: 4 }, serving: 150, tags: ['vegan', 'halal_ok'] },
  { id: 'pumpkin', name: 'Courge / potiron', category: 'veg', cultures: 'all', per100: { kcal: 26, p: 1, c: 6.5, f: 0.1, fiber: 1.5 }, serving: 200, tags: ['vegan', 'halal_ok'] },
  { id: 'cauliflower', name: 'Chou-fleur', category: 'veg', cultures: 'all', per100: { kcal: 25, p: 1.9, c: 5, f: 0.3, fiber: 2 }, serving: 150, tags: ['vegan', 'halal_ok'] },
  { id: 'mushrooms', name: 'Champignons', category: 'veg', cultures: 'all', per100: { kcal: 22, p: 3.1, c: 3.3, f: 0.3, fiber: 1 }, serving: 150, tags: ['vegan', 'halal_ok'] },
  { id: 'cucumber_tomato', name: 'Concombre, tomate, oignon rouge', category: 'veg', cultures: 'all', per100: { kcal: 18, p: 0.8, c: 3.5, f: 0.2, fiber: 1 }, serving: 180, tags: ['vegan', 'halal_ok'] },
  { id: 'bok_choy', name: 'Pak choï / chou chinois sauté', category: 'veg', cultures: ['east_asia'], per100: { kcal: 20, p: 1.5, c: 2.5, f: 0.5, fiber: 1 }, serving: 150, tags: ['vegan', 'halal_ok'] },
  { id: 'ratatouille', name: 'Ratatouille', category: 'veg', cultures: ['europe', 'maghreb'], per100: { kcal: 45, p: 1.2, c: 6, f: 2, fiber: 2.5 }, serving: 200, tags: ['vegan', 'halal_ok'] },
  // ---- Fruits (suite) ----
  { id: 'dates', name: 'Dattes', category: 'fruit', cultures: ['maghreb', 'middle_east', 'west_africa'], per100: { kcal: 280, p: 2, c: 65, f: 0.4, fiber: 8 }, serving: 40, tags: ['vegan', 'halal_ok'] },
  { id: 'watermelon', name: 'Pastèque', category: 'fruit', cultures: 'all', per100: { kcal: 30, p: 0.6, c: 7.5, f: 0.2, fiber: 0.4 }, serving: 250, tags: ['vegan', 'halal_ok'] },
  { id: 'guava', name: 'Goyave', category: 'fruit', cultures: ['west_africa', 'south_asia', 'latin_america'], per100: { kcal: 68, p: 2.6, c: 14, f: 1, fiber: 5.4 }, serving: 150, tags: ['vegan', 'halal_ok'] },
  { id: 'kiwi', name: 'Kiwi', category: 'fruit', cultures: ['europe'], per100: { kcal: 61, p: 1.1, c: 15, f: 0.5, fiber: 3 }, serving: 120, tags: ['vegan', 'halal_ok'] },
  { id: 'grapes', name: 'Raisin', category: 'fruit', cultures: 'all', per100: { kcal: 69, p: 0.7, c: 18, f: 0.2, fiber: 0.9 }, serving: 120, tags: ['vegan', 'halal_ok'] },
  // ---- Lipides (suite) ----
  { id: 'tahini', name: 'Tahini (purée de sésame)', category: 'fat', cultures: ['middle_east', 'maghreb'], per100: { kcal: 595, p: 17, c: 12, f: 54, fiber: 9 }, serving: 20, tags: ['vegan', 'halal_ok'] },
  { id: 'olives', name: 'Olives', category: 'fat', cultures: ['europe', 'maghreb', 'middle_east'], per100: { kcal: 145, p: 1, c: 4, f: 15, fiber: 3 }, serving: 40, tags: ['vegan', 'halal_ok'] },
  { id: 'coconut_milk_light', name: 'Lait de coco allégé', category: 'fat', cultures: ['west_africa', 'south_asia', 'east_asia'], per100: { kcal: 95, p: 1, c: 3, f: 9, fiber: 0 }, serving: 80, tags: ['vegan', 'halal_ok'] },
  { id: 'almond_butter', name: 'Purée d’amande', category: 'fat', cultures: ['europe'], per100: { kcal: 610, p: 21, c: 19, f: 55, fiber: 10 }, serving: 20, tags: ['nuts', 'vegan', 'halal_ok'] },
  { id: 'dark_chocolate', name: 'Chocolat noir 85 %', category: 'fat', cultures: 'all', per100: { kcal: 590, p: 10, c: 20, f: 48, fiber: 11 }, serving: 15, tags: ['vegan', 'halal_ok'], note: 'Un ou deux carrés : du plaisir, pas une interdiction.' },
  // ---- Plats traditionnels (suite) ----
  { id: 'yassa', name: 'Poulet yassa (sauce oignons-citron)', category: 'dish', cultures: ['west_africa'], per100: { kcal: 130, p: 15, c: 6, f: 5, fiber: 1 }, serving: 250, tags: ['meat', 'halal_ok'] },
  { id: 'ndole', name: 'Ndolé (feuilles, arachide, viande ou crevettes)', category: 'dish', cultures: ['west_africa'], per100: { kcal: 165, p: 11, c: 6, f: 11, fiber: 3 }, serving: 250, tags: ['nuts', 'meat', 'halal_ok'] },
  { id: 'egusi', name: 'Sauce egusi (graines de courge) avec poisson', category: 'dish', cultures: ['west_africa'], per100: { kcal: 185, p: 11, c: 5, f: 14, fiber: 2.5 }, serving: 250, tags: ['fish', 'halal_ok'] },
  { id: 'okra_soup', name: 'Sauce gombo avec poisson fumé', category: 'dish', cultures: ['west_africa'], per100: { kcal: 90, p: 9, c: 6, f: 3.5, fiber: 3 }, serving: 250, tags: ['fish', 'halal_ok'] },
  { id: 'couscous_royal', name: 'Couscous aux légumes et viande (sans semoule)', category: 'dish', cultures: ['maghreb'], per100: { kcal: 95, p: 9, c: 7, f: 3.5, fiber: 2.5 }, serving: 300, tags: ['meat', 'halal_ok'] },
  { id: 'chicken_curry', name: 'Curry de poulet (lait de coco allégé)', category: 'dish', cultures: ['south_asia', 'east_asia'], per100: { kcal: 140, p: 14, c: 5, f: 7, fiber: 1 }, serving: 250, tags: ['meat', 'halal_ok'] },
  { id: 'chili', name: 'Chili con carne (haricots, bœuf maigre)', category: 'dish', cultures: ['latin_america', 'europe'], per100: { kcal: 120, p: 10, c: 11, f: 4, fiber: 4 }, serving: 300, tags: ['meat', 'halal_ok'] },
  { id: 'bolognese', name: 'Sauce bolognaise (bœuf maigre)', category: 'dish', cultures: ['europe'], per100: { kcal: 110, p: 10, c: 6, f: 5, fiber: 1.5 }, serving: 200, tags: ['meat', 'halal_ok'] },
  { id: 'poke_bowl', name: 'Poke bowl saumon (sans riz)', category: 'dish', cultures: ['east_asia', 'europe'], per100: { kcal: 120, p: 12, c: 6, f: 6, fiber: 2 }, serving: 250, tags: ['fish'] },
  { id: 'stir_fry', name: 'Sauté de légumes et bœuf / tofu (wok)', category: 'dish', cultures: ['east_asia'], per100: { kcal: 110, p: 11, c: 6, f: 5, fiber: 2 }, serving: 300, tags: ['meat', 'halal_ok'] },
  { id: 'soup_lentil', name: 'Soupe de lentilles (harira légère)', category: 'dish', cultures: ['maghreb', 'middle_east'], per100: { kcal: 75, p: 5, c: 11, f: 1.5, fiber: 3.5 }, serving: 350, tags: ['vegan', 'vegetarian', 'halal_ok'] },
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
