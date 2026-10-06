'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Check, Plus, Trash2, Undo2 } from 'lucide-react';
import { analyzeProgram, EXERCISES, EXERCISE_BY_ID, MUSCLE_LABEL, type CustomProgram } from '@recomp/engine';
import { Card, accentColor } from '@/components/ui/Card';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { EvidenceBadge } from '@/components/ui/Evidence';
import { useComputed } from '@/lib/useComputed';
import { useStore } from '@/lib/store';
import { cx } from '@/lib/format';

const WEEKDAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

export default function ProgramImport() {
  const { state, computed: c } = useComputed();
  const updateProfile = useStore((s) => s.updateProfile);
  const [custom, setCustom] = useState<CustomProgram>(() => state?.profile.customProgram ?? { name: 'Mon programme', days: [{ name: 'Séance 1', weekday: 1, exercises: [] }] });
  const [search, setSearch] = useState<Record<number, string>>({});
  const analysis = useMemo(() => (state ? analyzeProgram(custom, state.profile) : null), [custom, state]);
  const generated = useMemo(() => (state && c ? analyzeProgram({ name: c.program.split, days: c.program.days.map((d) => ({ name: d.name, weekday: d.weekday, exercises: d.exercises.map((e) => ({ exerciseId: e.exerciseId, sets: e.sets, repMin: e.repMin, repMax: e.repMax })) })) }, state.profile) : null), [state, c]);
  if (!state || !c || !analysis || !generated) return null;
  const p = state.profile;
  const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const setDay = (i: number, patch: Partial<CustomProgram['days'][number]>) => setCustom({ ...custom, days: custom.days.map((d, k) => (k === i ? { ...d, ...patch } : d)) });
  const addEx = (i: number, id: string) => { const ex = EXERCISE_BY_ID[id]!; setDay(i, { exercises: [...custom.days[i]!.exercises, { exerciseId: id, sets: 3, repMin: ex.repRange[0], repMax: ex.repRange[1] }] }); setSearch({ ...search, [i]: '' }); };
  const usingCustom = Boolean(p.customProgram && p.customProgram.days.length);
  const tone = analysis.score >= 80 ? accentColor('vitality') : analysis.score >= 60 ? accentColor('recovery') : accentColor('muscle');

  return (
    <div className="space-y-6">
      <header className="rise">
        <div className="label">Entraînement</div>
        <h1 className="text-3xl font-extrabold tracking-tight mt-1">Analyser ou importer un programme</h1>
        <p className="text-ink-2 mt-1 max-w-2xl">Tu as déjà un programme (coach, ami, internet) ? Saisis-le : le moteur le compare aux repères scientifiques et te dit s’il tient la route. Tu peux ensuite l’adopter, il profitera de la progression automatique et de l’adaptation à ta forme du jour.</p>
      </header>

      {usingCustom && <div className="card-2 border-l-4 border-l-[var(--accent-body)] px-4 py-3 text-sm flex flex-wrap items-center justify-between gap-3"><span>Tu suis actuellement ton programme importé « {p.customProgram!.name} ».</span><button className="btn btn-secondary btn-sm" onClick={() => updateProfile({ customProgram: null })}><Undo2 size={14} /> Revenir au programme généré</button></div>}

      <section className="grid lg:grid-cols-[1.1fr_0.9fr] gap-4 rise rise-1">
        <div className="space-y-3">
          <Card kicker="Ton programme" title={<input className="input h-9 font-semibold" value={custom.name} onChange={(e) => setCustom({ ...custom, name: e.target.value })} aria-label="Nom du programme" />}>
            {custom.days.map((d, i) => (
              <div key={i} className="card-2 p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <input className="input h-9 flex-1" value={d.name} onChange={(e) => setDay(i, { name: e.target.value })} aria-label="Nom de la séance" />
                  <select className="input h-9 w-20" value={d.weekday} onChange={(e) => setDay(i, { weekday: Number(e.target.value) })} aria-label="Jour">{WEEKDAYS.map((w, k) => <option key={w} value={k}>{w}</option>)}</select>
                  <button className="btn btn-ghost btn-sm" onClick={() => setCustom({ ...custom, days: custom.days.filter((_, k) => k !== i) })} aria-label="Supprimer la séance"><Trash2 size={14} /></button>
                </div>
                {d.exercises.map((e, k) => (
                  <div key={k} className="grid grid-cols-[1fr_52px_52px_52px_32px] gap-1.5 items-center text-sm">
                    <div className="truncate">{EXERCISE_BY_ID[e.exerciseId]?.name ?? e.exerciseId}</div>
                    <input className="input h-8 px-2 text-center" type="number" min={1} max={10} value={e.sets} onChange={(ev) => setDay(i, { exercises: d.exercises.map((x, j) => (j === k ? { ...x, sets: Number(ev.target.value) } : x)) })} aria-label="Séries" />
                    <input className="input h-8 px-2 text-center" type="number" min={1} value={e.repMin} onChange={(ev) => setDay(i, { exercises: d.exercises.map((x, j) => (j === k ? { ...x, repMin: Number(ev.target.value) } : x)) })} aria-label="Reps min" />
                    <input className="input h-8 px-2 text-center" type="number" min={1} value={e.repMax} onChange={(ev) => setDay(i, { exercises: d.exercises.map((x, j) => (j === k ? { ...x, repMax: Number(ev.target.value) } : x)) })} aria-label="Reps max" />
                    <button className="btn btn-ghost btn-sm" onClick={() => setDay(i, { exercises: d.exercises.filter((_, j) => j !== k) })} aria-label="Retirer"><Trash2 size={13} /></button>
                  </div>
                ))}
                {d.exercises.length > 0 && <div className="grid grid-cols-[1fr_52px_52px_52px_32px] gap-1.5 text-[10px] text-ink-3 uppercase"><span /><span className="text-center">séries</span><span className="text-center">min</span><span className="text-center">max</span><span /></div>}
                <div className="relative">
                  <input className="input h-9" placeholder="Ajouter un exercice (tape pour chercher)…" value={search[i] ?? ''} onChange={(e) => setSearch({ ...search, [i]: e.target.value })} aria-label="Ajouter un exercice" />
                  {(search[i] ?? '').length >= 2 && (
                    <div className="absolute z-10 left-0 right-0 mt-1 card p-1 max-h-56 overflow-auto">
                      {EXERCISES.filter((ex) => norm(ex.name).includes(norm(search[i]!)) || ex.muscles.some((m) => norm(MUSCLE_LABEL[m]).includes(norm(search[i]!)))).slice(0, 8).map((ex) => <button key={ex.id} className="w-full text-left px-3 py-2 rounded-lg hover:bg-surface-2 text-sm" onClick={() => addEx(i, ex.id)}>{ex.name} <span className="text-ink-3 text-xs">· {ex.muscles.slice(0, 2).map((m) => MUSCLE_LABEL[m]).join(', ')}</span></button>)}
                      <Link href="/app/exercises" className="block px-3 py-2 text-xs text-ink-2 hover:text-ink">Voir toute la bibliothèque</Link>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <button className="btn btn-secondary btn-sm self-start" onClick={() => setCustom({ ...custom, days: [...custom.days, { name: `Séance ${custom.days.length + 1}`, weekday: Math.min(6, custom.days.length * 2 + 1), exercises: [] }] })}><Plus size={14} /> Ajouter une séance</button>
          </Card>
        </div>

        <div className="space-y-3">
          <Card kicker="Verdict du moteur" title={analysis.verdict} accent={analysis.score >= 80 ? 'vitality' : analysis.score >= 60 ? 'recovery' : 'muscle'}>
            <div className="flex items-center gap-5">
              <ScoreRing value={analysis.score} size={96} stroke={9} color={tone} label="Ton programme" />
              <ScoreRing value={generated.score} size={72} stroke={7} color={accentColor('body')} label="Généré" />
              <p className="text-xs text-ink-2 flex-1">Comparaison avec le programme que le moteur génère pour ton profil ({c.program.split}).</p>
            </div>
            <ul className="space-y-2 text-sm">
              {analysis.issues.map((it, i) => (
                <li key={i} className={cx('flex items-start gap-2 rounded-lg px-3 py-2', it.level === 'good' ? 'bg-[color-mix(in_srgb,var(--accent-vitality)_12%,transparent)]' : it.level === 'warn' ? 'bg-[color-mix(in_srgb,var(--accent-recovery)_14%,transparent)]' : 'bg-[color-mix(in_srgb,var(--accent-muscle)_14%,transparent)]')}>
                  <span className="mt-0.5 shrink-0">{it.level === 'good' ? <Check size={14} /> : it.level === 'warn' ? '!' : '✕'}</span>
                  <span className="flex-1">{it.text}{it.evidenceId && <EvidenceBadge id={it.evidenceId} className="ml-2 align-middle" />}</span>
                </li>
              ))}
            </ul>
            <div className="text-xs text-ink-3">Durée estimée : {analysis.estimatedMinutesPerSession.map((m, i) => `${custom.days[i]?.name ?? ''} ${m} min`).join(' · ')}.</div>
            <div className="flex flex-wrap gap-2">
              <button className="btn btn-primary" disabled={analysis.score === 0} onClick={() => updateProfile({ customProgram: custom })}><Check size={16} /> Utiliser ce programme</button>
              {usingCustom && <button className="btn btn-secondary" onClick={() => updateProfile({ customProgram: null })}>Revenir au programme généré</button>}
            </div>
          </Card>
          <Card kicker="Volume hebdomadaire" title="Séries par muscle (secondaires = ½)">
            <div className="space-y-1.5">
              {analysis.setsPerMuscle.filter((m) => m.sets > 0 || ['quads', 'hamstrings', 'glutes', 'chest', 'back', 'lats', 'side_delts'].includes(m.muscle)).map((m) => (
                <div key={m.muscle} className="text-xs">
                  <div className="flex justify-between"><span>{m.label}</span><span className="tnum text-ink-2">{m.sets} séries · {m.frequency}×/sem</span></div>
                  <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${Math.min(100, (m.sets / 25) * 100)}%`, background: m.sets < 6 ? 'var(--accent-muscle)' : m.sets <= 20 ? 'var(--accent-vitality)' : 'var(--accent-recovery)' }} /></div>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-ink-3">Zone verte : 10–20 séries/semaine. Rouge : moins de 6. Ambre : plus de 20.</p>
          </Card>
        </div>
      </section>
    </div>
  );
}
