'use client';
import { useState } from 'react';
import { adaptHabitualDish, APPROACHES, FOODS, TRADITIONAL_DISHES, buildDayPlan, daySeed, fitMealTo, sameBenefits, swapMealItem, type Meal, type NutritionPrecision } from '@recomp/engine';
import { Check, Shuffle, Undo2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { PlateDiagram } from '@/components/ui/PlateDiagram';
import { Segmented, Sheet } from '@/components/ui/Primitives';
import { EvidenceBadge, WhyButton } from '@/components/ui/Evidence';
import { useComputed } from '@/lib/useComputed';
import { today, useStore } from '@/lib/store';
import { cx } from '@/lib/format';

export default function Food() {
  const { state, computed: c } = useComputed();
  const updateProfile = useStore((s) => s.updateProfile);
  const addMeal = useStore((s) => s.addMeal);
  const [dish, setDish] = useState<string>('sauce_feuille');
  const [carb, setCarb] = useState<string>('rice_white');
  const [logOpen, setLogOpen] = useState(false);
  const [variants, setVariants] = useState<Record<string, number>>({});
  const [swaps, setSwaps] = useState<Record<string, [string, string][]>>({});
  const [log, setLog] = useState({ proteinServings: 3, vegServings: 3, carbServings: 2, fatServings: 2, waterMl: 2000, flexMeal: false });
  if (!state || !c) return null;
  const p = state.profile;
  const simple = p.nutritionPrecision === 'simple';
  const n = c.nutrition;
  const basePlan = Object.keys(variants).length ? buildDayPlan(n, p, daySeed(today()), variants) : c.dayPlan;
  const original = (id: string) => c.dayPlan.meals.find((m) => m.id === id);
  const dayPlan = { ...basePlan, meals: basePlan.meals.map((m) => { const o = original(m.id); const fitted = variants[m.id] && o ? fitMealTo(m as Meal, o.macros) : (m as Meal); return (swaps[m.id] ?? []).reduce((acc, [from, to]) => fitMealTo(swapMealItem(acc, from, to), (o ?? m).macros), fitted); }) };
  const shuffle = (id: string) => { let v = Math.floor(Math.random() * 40) + 1; if (v === (variants[id] ?? 0)) v += 1; setVariants({ ...variants, [id]: v }); setSwaps({ ...swaps, [id]: [] }); };
  const reset = (id: string) => { const nv = { ...variants }; delete nv[id]; setVariants(nv); setSwaps({ ...swaps, [id]: [] }); };
  const habitual = adaptHabitualDish(dish, carb, n, 0.35);
  const carbs = FOODS.filter((f) => f.category === 'carb');

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4 rise">
        <div>
          <div className="label">Nutrition · {c.brief.dayType === 'training' ? 'jour d’entraînement' : 'jour de repos'}</div>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1">Qu’est-ce que je mange aujourd’hui ?</h1>
          <p className="text-ink-2 mt-1 max-w-2xl">{n.strategy}. {dayPlan.structure}</p>
        </div>
        <Segmented value={p.nutritionPrecision} onChange={(v: NutritionPrecision) => updateProfile({ nutritionPrecision: v })} options={[{ value: 'simple', label: 'Mode simple' }, { value: 'precise', label: 'Mode précis' }]} />
      </header>

      {n.notes.length > 0 && <div className="flex flex-col gap-2">{n.notes.map((x) => <div key={x} className="card-2 border-l-4 border-l-[var(--accent-nutrition)] px-4 py-3 text-sm">{x}</div>)}</div>}

      <section className="grid md:grid-cols-[1fr_1.2fr] gap-4 rise rise-1">
        <Card accent="nutrition" kicker="Cibles du jour" title={simple ? 'En portions-main' : `${n.kcal} kcal`} right={<WhyButton explanation={n.explanation} />}>
          {simple ? (
            <div className="grid grid-cols-2 gap-2">
              {[['Paumes de protéines', n.simple.proteinPalms, 'une paume ≈ 100–120 g de viande, poisson, tofu ; 3 œufs'], ['Poings de légumes', n.simple.vegFists, 'crus ou cuits, à chaque repas principal'], ['Poings de glucides', n.simple.carbFists, 'riz, igname, attiéké, patate douce, pain…'], ['Pouces de bonnes graisses', n.simple.fatThumbs, 'huile, avocat, arachides, graines']].map(([l, v, d]) => (
                <div key={String(l)} className="card-2 p-3"><div className="text-3xl font-bold tnum">{v}</div><div className="text-sm font-medium">{l}</div><div className="text-xs text-ink-3 mt-0.5">{d}</div></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {[['Protéines', `${n.proteinG} g`, `${n.proteinPerKg} g/kg`], ['Glucides', `${n.carbsG} g`, c.brief.dayType === 'training' ? 'autour de la séance' : 'modérés'], ['Lipides', `${n.fatG} g`, '≥ 0,8 g/kg'], ['Fibres', `${n.fiberG} g`, '≈ 14 g / 1 000 kcal']].map(([l, v, d]) => (
                <div key={String(l)} className="card-2 p-3"><div className="text-2xl font-bold tnum">{v}</div><div className="text-sm font-medium">{l}</div><div className="text-xs text-ink-3 mt-0.5">{d}</div></div>
              ))}
            </div>
          )}
          <div className="text-sm text-ink-2">Hydratation : {dayPlan.hydration}</div>
          <div className="flex flex-wrap gap-2"><EvidenceBadge id="protein_intake" /><EvidenceBadge id={n.explanation.evidenceId} /><EvidenceBadge id="hydration" /></div>
          {!simple && <p className="text-xs text-ink-3">Dépense estimée ≈ {n.tdee} kcal (±10 %). Point de départ corrigé par tes tendances réelles, pas une vérité.</p>}
        </Card>
        <Card accent="nutrition" kicker="Assiette recomposition" title="Les proportions qui comptent">
          <PlateDiagram plate={dayPlan.plate} size={180} />
          <p className="text-sm text-ink-2">Les proportions s’adaptent : jour d’entraînement → plus de glucides ; repos, fatigue, faim → plus de volume végétal et de protéines.</p>
        </Card>
      </section>

      <section className="rise rise-2">
        <div className="flex items-center justify-between mb-3 gap-3"><div><h2 className="font-bold text-lg">Ton plan de repas</h2><p className="text-xs text-ink-2">Un menu différent chaque jour, jamais la même idée deux jours de suite. Pas envie ? « Une autre idée ».</p></div><button className="btn btn-secondary btn-sm shrink-0" onClick={() => setLogOpen(true)}>Noter ma journée</button></div>
        <div className="grid md:grid-cols-2 gap-4">
          {dayPlan.meals.map((m) => (
            <Card key={m.id} title={m.title} kicker={`${m.name} · ${m.timing}`} right={<div className="flex items-center gap-1">{(variants[m.id] || swaps[m.id]?.length) ? <button className="btn btn-ghost btn-sm" onClick={() => reset(m.id)} title="Revenir au repas proposé"><Undo2 size={14} /></button> : null}<button className="btn btn-secondary btn-sm" onClick={() => shuffle(m.id)} title="Changer ce repas au hasard, mêmes apports"><Shuffle size={14} /> Changer</button></div>}>
              {(() => { const o = original(m.id); if (!o || o.title === m.title && !swaps[m.id]?.length) return null; const cmp = sameBenefits(o.macros, m.macros); return <div className={cx('text-xs rounded-lg px-2.5 py-1.5 inline-flex items-center gap-1.5', cmp.equivalent ? 'bg-[color-mix(in_srgb,var(--accent-vitality)_14%,transparent)]' : 'bg-[color-mix(in_srgb,var(--accent-recovery)_16%,transparent)]')}>{cmp.equivalent ? <Check size={12} /> : null}{cmp.equivalent ? 'Mêmes bénéfices' : 'Apports légèrement différents'} : protéines {cmp.dP >= 0 ? '+' : ''}{cmp.dP} g · {cmp.dKcal >= 0 ? '+' : ''}{cmp.dKcal} kcal par rapport au repas proposé</div>; })()}
              {!simple && <div className="text-xs tnum text-ink-3">{Math.round(m.macros.kcal)} kcal · P {Math.round(m.macros.p)} g · G {Math.round(m.macros.c)} g · L {Math.round(m.macros.f)} g</div>}
              {simple ? (
                <div className="text-sm space-y-2"><p>{m.simple}</p><div className="flex flex-wrap gap-1">{m.items.filter((i) => i.role === 'protein' || i.role === 'carb' || i.role === 'dish').flatMap((it) => it.alternatives.slice(0, 2).map((a) => <button key={it.foodId + a.foodId} className="chip h-6 text-[11px]" onClick={() => setSwaps({ ...swaps, [m.id]: [...(swaps[m.id] ?? []), [it.foodId, a.foodId]] })}>⇄ {a.name.toLowerCase()}</button>))}</div></div>
              ) : (
                <ul className="text-sm space-y-2">
                  {m.items.map((it) => (
                    <li key={it.foodId} className="flex flex-col gap-0.5">
                      <div className="flex justify-between gap-3"><span>{it.name}</span><span className="tnum font-medium shrink-0">{it.grams} g</span></div>
                      {it.alternatives.length > 0 && <div className="flex flex-wrap gap-1 text-xs">{it.alternatives.map((a) => <button key={a.foodId} className="chip h-6 text-[11px]" onClick={() => setSwaps({ ...swaps, [m.id]: [...(swaps[m.id] ?? []), [it.foodId, a.foodId]] })} title="Remplacer, mêmes apports">⇄ {a.name.toLowerCase()} {a.grams} g</button>)}</div>}
                    </li>
                  ))}
                </ul>
              )}
              {m.tip && <p className="text-xs text-ink-2 card-2 p-2.5">{m.tip}</p>}
            </Card>
          ))}
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-4 rise rise-3">
        <Card accent="nutrition" kicker="Vraie vie" title="Tu peux manger ton plat habituel">
          <p className="text-sm text-ink-2">Choisis ton plat : voici comment ajuster portion et accompagnement, sans le supprimer.</p>
          <div className="grid grid-cols-2 gap-2">
            <select className="input" aria-label="Plat habituel" value={dish} onChange={(e) => setDish(e.target.value)}>{TRADITIONAL_DISHES.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
            <select className="input" aria-label="Accompagnement" value={carb} onChange={(e) => setCarb(e.target.value)}>{carbs.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
          </div>
          {habitual && <ul className="text-sm space-y-1.5 list-disc pl-4">{habitual.lines.map((l) => <li key={l}>{l}</li>)}</ul>}
          {habitual && !simple && <div className="text-xs text-ink-3 tnum">≈ {habitual.macros.kcal} kcal · P {Math.round(habitual.macros.p)} g</div>}
        </Card>
        <Card kicker="Outils facultatifs" title="Jeûne intermittent, repas libre, approches">
          <div className="card-2 p-3 text-sm">
            <div className="flex items-center justify-between gap-2 mb-1"><span className="font-semibold">Fenêtre alimentaire réduite</span><EvidenceBadge id="time_restricted_eating" /></div>
            <p className="text-ink-2">{c.fasting.reasons[0]}</p>
            <div className="text-xs text-ink-3 mt-1">Verdict : {c.fasting.verdict === 'ok' ? 'envisageable' : c.fasting.verdict === 'caution' ? 'prudence' : 'déconseillé pour l’instant'}{c.fasting.suggestedWindow ? ` · ${c.fasting.suggestedWindow}` : ''}</div>
          </div>
          <div className="card-2 p-3 text-sm">
            <div className="flex items-center justify-between gap-2 mb-1"><span className="font-semibold">Flex meal</span><EvidenceBadge id="flex_meal_adherence" /></div>
            <p className="text-ink-2">{(c.review.metrics.adherence ?? 0) >= 0.8 ? 'Ta régularité est bonne : un repas libre cette semaine sert ton adhérence. Aucune compensation ensuite.' : 'Un repas libre reste possible : il ne « coûte » rien s’il est suivi d’un retour au rythme normal. Pas de rattrapage.'}</p>
          </div>
          <details className="text-sm">
            <summary className="cursor-pointer font-medium">Approches populaires : ce que montrent les données</summary>
            <div className="space-y-3 mt-3">
              {APPROACHES.map((a) => (
                <div key={a.id} className="card-2 p-3">
                  <div className="flex items-center justify-between gap-2"><span className="font-semibold">{a.name}</span><EvidenceBadge level={a.level} /></div>
                  <div className="text-xs text-ink-3">{a.attributedTo}</div>
                  <p className="text-ink-2 mt-1"><span className="font-medium text-ink">Principe : </span>{a.principle}</p>
                  <p className="text-ink-2 mt-1"><span className="font-medium text-ink">Données : </span>{a.whatDataShow}</p>
                  <p className="mt-1"><span className="font-medium">Chez RECOMP : </span>{a.howWeUseIt}</p>
                </div>
              ))}
            </div>
          </details>
        </Card>
      </section>

      <Sheet open={logOpen} onClose={() => setLogOpen(false)} title="Ma journée alimentaire">
        <div className="space-y-3 text-sm">
          {[['proteinServings', 'Portions de protéines'], ['vegServings', 'Portions de légumes'], ['carbServings', 'Portions de glucides'], ['fatServings', 'Portions de graisses']].map(([k, l]) => (
            <label key={k} className="flex items-center justify-between gap-3"><span>{l}</span><input className="input w-24 h-10 text-center" type="number" min={0} value={log[k as keyof typeof log] as number} onChange={(e) => setLog({ ...log, [k as string]: Number(e.target.value) })} /></label>
          ))}
          <label className="flex items-center justify-between gap-3"><span>Eau (ml)</span><input className="input w-28 h-10 text-center" type="number" step={250} value={log.waterMl} onChange={(e) => setLog({ ...log, waterMl: Number(e.target.value) })} /></label>
          <label className="flex items-center gap-3"><input type="checkbox" checked={log.flexMeal} onChange={(e) => setLog({ ...log, flexMeal: e.target.checked })} /> Un repas libre aujourd’hui (aucune compensation demain, promis)</label>
          <button className="btn btn-primary w-full" onClick={() => { addMeal({ date: today(), ...log }); setLogOpen(false); }}>Enregistrer</button>
        </div>
      </Sheet>
    </div>
  );
}
