'use client';
import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ExternalLink, Search } from 'lucide-react';
import { EXERCISES, EXERCISE_PHOTOS, MUSCLE_LABEL, PATTERN_LABEL, demoVideoUrl, substitutesFor, type Equipment, type Exercise, type Muscle, type MovementPattern } from '@recomp/engine';
import { PhotoFrame } from '@/components/ui/Photo';
import { BodyMap, Pictogram } from '@/components/ui/Anatomy';
import { Card } from '@/components/ui/Card';
import { Chip, Segmented, Sheet } from '@/components/ui/Primitives';
import { useComputed } from '@/lib/useComputed';
import { cx } from '@/lib/format';

const EQUIP: { v: Equipment | 'all'; l: string }[] = [{ v: 'all', l: 'Tout' }, { v: 'gym', l: 'Salle' }, { v: 'home_basic', l: 'Maison' }, { v: 'home_none', l: 'Sans matériel' }];

export default function ExercisesPage() {
  return <Suspense fallback={null}><Exercises /></Suspense>;
}

function Exercises() {
  const { state, computed: c } = useComputed();
  const params = useSearchParams();
  const [q, setQ] = useState('');
  const [equip, setEquip] = useState<Equipment | 'all'>('all');
  const [muscle, setMuscle] = useState<Muscle | null>(null);
  const [pattern, setPattern] = useState<MovementPattern | null>(null);
  const [open, setOpen] = useState<Exercise | null>(() => EXERCISES.find((e) => e.id === params.get('id')) ?? null);
  const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const list = useMemo(() => EXERCISES.filter((e) => (equip === 'all' || e.equipment.includes(equip)) && (!muscle || e.muscles.includes(muscle)) && (!pattern || e.pattern === pattern) && (!q || norm(e.name).includes(norm(q)) || e.muscles.some((m) => norm(MUSCLE_LABEL[m]).includes(norm(q))))), [q, equip, muscle, pattern]);
  if (!state || !c) return null;
  const p = state.profile;
  const inProgram = new Set(c.program.days.flatMap((d) => d.exercises.map((e) => e.exerciseId)));
  const excluded = p.limitations.map((l) => l.region);

  return (
    <div className="space-y-6">
      <header className="rise">
        <div className="label">Bibliothèque</div>
        <h1 className="text-3xl font-extrabold tracking-tight mt-1">Les exercices, expliqués</h1>
        <p className="text-ink-2 mt-1 max-w-2xl">Mouvement, muscles sollicités, exécution pas à pas, erreurs fréquentes et substituts. Les exercices de ton programme sont marqués.</p>
      </header>

      <div className="card p-4 flex flex-col gap-3 rise rise-1">
        <div className="flex flex-col md:flex-row gap-3">
          <label className="relative flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" /><input className="input pl-9" placeholder="Rechercher un exercice ou un muscle…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Rechercher" /></label>
          <Segmented value={equip} onChange={setEquip} options={EQUIP.map((e) => ({ value: e.v, label: e.l }))} />
        </div>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(PATTERN_LABEL) as MovementPattern[]).map((k) => <Chip key={k} on={pattern === k} onClick={() => setPattern(pattern === k ? null : k)}>{PATTERN_LABEL[k]}</Chip>)}
        </div>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(MUSCLE_LABEL) as Muscle[]).map((k) => <Chip key={k} on={muscle === k} onClick={() => setMuscle(muscle === k ? null : k)}>{MUSCLE_LABEL[k]}</Chip>)}
        </div>
      </div>

      <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 rise rise-2">
        {list.map((e) => {
          const risky = e.stress.some((r) => excluded.includes(r));
          return (
            <button key={e.id} onClick={() => setOpen(e)} className={cx('card p-4 text-left flex gap-4 items-start hover:shadow-md transition-shadow', risky && 'opacity-60')}>
              {EXERCISE_PHOTOS[e.id] ? <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-surface-2"><img src={EXERCISE_PHOTOS[e.id]!.url} alt="" loading="lazy" className="w-full h-full object-cover" style={{ filter: 'saturate(0.88)' }} /></div> : <Pictogram pattern={e.pattern} size={64} />}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2"><div className="font-semibold leading-tight">{e.name}</div>{inProgram.has(e.id) && <span className="chip pointer-events-none text-[10px] h-6 shrink-0">Ton programme</span>}</div>
                <div className="text-xs text-ink-2 mt-1">{PATTERN_LABEL[e.pattern]} · {e.muscles.slice(0, 3).map((m) => MUSCLE_LABEL[m]).join(', ')}</div>
                <div className="text-[11px] text-ink-3 mt-1">{e.repRange[0]}–{e.repRange[1]} {e.id === 'plank' || e.id === 'farmer_carry' ? 's' : 'reps'} · {e.minLevel === 'beginner' ? 'débutant' : e.minLevel === 'intermediate' ? 'intermédiaire' : 'avancé'}{risky ? ' · zone sensible déclarée' : ''}</div>
              </div>
            </button>
          );
        })}
        {list.length === 0 && <p className="text-sm text-ink-3">Aucun exercice pour ces filtres.</p>}
      </section>

      <Sheet open={Boolean(open)} onClose={() => setOpen(null)} title={open?.name}>
        {open && (
          <div className="space-y-4">
            {EXERCISE_PHOTOS[open.id] && <PhotoFrame photo={EXERCISE_PHOTOS[open.id]!} ratio="16/9" />}
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <div className="card-2 p-3 flex items-center justify-center"><Pictogram pattern={open.pattern} size={110} /></div>
              <div className="flex-1 space-y-2 text-sm">
                <div><span className="label">Mouvement</span><div>{PATTERN_LABEL[open.pattern]}</div></div>
                <div><span className="label">Muscles</span><div className="flex flex-wrap gap-1.5 mt-1">{open.muscles.map((m, i) => <span key={m} className={cx('chip pointer-events-none', i === 0 && 'font-semibold')}>{MUSCLE_LABEL[m]}{i === 0 ? ' (principal)' : ''}</span>)}</div></div>
                <div><span className="label">Fourchette</span><div>{open.repRange[0]}–{open.repRange[1]} {open.id === 'plank' || open.id === 'farmer_carry' ? 'secondes' : 'répétitions'} · repos {open.compound ? '90–120' : '60'} s</div></div>
              </div>
              <BodyMap muscles={open.muscles} size={150} />
            </div>
            {open.steps && <div><span className="label">Exécution</span><ol className="list-decimal pl-5 text-sm space-y-1 mt-1">{open.steps.map((s) => <li key={s}>{s}</li>)}</ol></div>}
            <div className="card-2 p-3 text-sm"><span className="label">Repère clé</span><div>{open.cues}</div></div>
            {open.mistakes && <div><span className="label">Erreurs fréquentes</span><ul className="list-disc pl-5 text-sm space-y-1 mt-1">{open.mistakes.map((s) => <li key={s}>{s}</li>)}</ul></div>}
            {open.stress.some((r) => excluded.includes(r)) && <p className="text-sm text-[var(--danger)]">Cet exercice sollicite une zone que tu as déclarée sensible. Préfère un substitut ci-dessous.</p>}
            <div><span className="label">Substituts ({p.equipment === 'gym' ? 'salle' : p.equipment === 'home_basic' ? 'maison' : 'sans matériel'})</span>
              <div className="flex flex-wrap gap-2 mt-1">{substitutesFor(open.id, p.equipment, p.level, excluded).map((s) => <button key={s.id} className="chip" onClick={() => setOpen(s)}>{s.name}</button>)}{substitutesFor(open.id, p.equipment, p.level, excluded).length === 0 && <span className="text-sm text-ink-3">Aucun avec ton matériel.</span>}</div>
            </div>
            <a href={demoVideoUrl(open)} target="_blank" rel="noreferrer" className="btn btn-secondary w-full"><ExternalLink size={16} /> Voir une démonstration vidéo</a>
            <p className="text-xs text-ink-3">Photos d’illustration (banque d’images) : elles montrent le mouvement, pas forcément la position idéale. Le pictogramme et les étapes font foi. En cas de doute, une séance avec un coach en salle vaut mieux qu’une vidéo.</p>
          </div>
        )}
      </Sheet>
    </div>
  );
}
