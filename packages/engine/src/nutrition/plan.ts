import type { Profile } from '../types';
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
export function buildDayPlan(targets: NutritionTargets, profile: Profile, seed = 0): DayPlan {
  const exclude = buildExclusion(profile.dietaryPreferences, profile.allergies, profile.dislikedFoods);
  const cultures = profile.foodCultures.length ? profile.foodCultures : ['europe' as const];
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
      // ordre d'affichage : protéines, légumes, glucides, lipides
      items.sort((a, b) => order(a.role) - order(b.role));
    }

    const macros = sum(items.map((x) => x.macros));
    const simple = describeSimple(items);
    const tip = slot.kind === 'dinner' && training && t === 'evening' ? 'Repas post-séance : protéines + glucides, c’est le bon moment.' : slot.kind === 'lunch' && training && t === 'midday' ? 'Séance proche : garde ce repas digeste, 1 h 30 avant ou juste après.' : undefined;
    return { id: slot.id, name: slot.name, timing: slot.timing, share: slot.share, items, macros, simple, tip };
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

function item(food: Food, grams: number, role: MealItem['role'], alts: Food[], targetProtein?: number, targetCarbs?: number): MealItem {
  return {
    foodId: food.id,
    name: food.name,
    grams,
    macros: macrosFor(food, grams),
    role,
    alternatives: alts.slice(0, 3).map((a) => ({
      foodId: a.id,
      name: a.name,
      grams: targetProtein ? roundGrams(targetProtein / (a.per100.p / 100), 10) : targetCarbs ? roundGrams(targetCarbs / (a.per100.c / 100), 10) : a.serving,
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
