'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { addDays, type DailyCheckin } from '@recomp/engine';
import { Card, Stat, accentColor } from '@/components/ui/Card';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { Sparkline } from '@/components/ui/Charts';
import { Alerts, Sheet, SliderField, TrendBadge } from '@/components/ui/Primitives';
import { EvidenceBadge, WhyButton } from '@/components/ui/Evidence';
import { useComputed } from '@/lib/useComputed';
import { today, useStore } from '@/lib/store';
import { cx, fmtDateLong } from '@/lib/format';

export default function Home() {
  const { state, computed: c } = useComputed();
  const upsertCheckin = useStore((s) => s.upsertCheckin);
  const [open, setOpen] = useState(false);
  const [ck, setCk] = useState<DailyCheckin>({ date: today(), energy: 3, sleepHours: 7, sleepQuality: 3, stress: 3, soreness: 2, motivation: 3, hunger: 3, mood: 3, steps: undefined, pain: null });
  const [pain, setPain] = useState(false);
  if (!state || !c) return null;
  const p = state.profile;
  const simple = p.nutritionPrecision === 'simple';
  const order = c.brief.emphasis;
  const w = c.series.weightRolling;
  const wDelta28 = w.length > 1 ? w[w.length - 1]!.value - (w.find((x) => x.date >= addDays(today(), -28))?.value ?? w[0]!.value) : 0;
  const waist = c.series.waist;
  const waistDelta = c.review.metrics.waistDelta ?? 0;
  const str = c.series.strength;
  const strDelta = c.review.metrics.strengthDeltaPct ?? 0;
  const adherence = c.review.metrics.adherence;

  const cards: Record<string, React.ReactNode> = {
    workout: (
      <Card key="workout" accent="muscle" kicker="Entraînement" title={c.session ? c.session.title : 'Repos'} emphasized={order[0] === 'workout'} right={<span className="text-xs text-ink-3">{c.session ? `${c.session.estimatedMinutes} min` : ''}</span>}>
        {c.session ? (
          <>
            <p className="text-sm text-ink-2">{c.session.message}</p>
            {!c.session.replacedByRecovery && (
              <ul className="text-sm space-y-1">
                {c.session.exercises.slice(0, 5).map((e) => <li key={e.exerciseId} className="flex justify-between gap-3"><span className="truncate">{e.name}</span><span className="tnum text-ink-2 shrink-0">{e.sets} × {e.repMin}–{e.repMax}</span></li>)}
              </ul>
            )}
            <Link href="/app/train" className="btn btn-primary btn-sm self-start">Commencer <ArrowRight size={14} /></Link>
          </>
        ) : (
          <p className="text-sm text-ink-2">Jour de repos : marche, mobilité, et un vrai dîner. Le muscle se construit entre les séances.</p>
        )}
      </Card>
    ),
    nutrition: (
      <Card key="nutrition" accent="nutrition" kicker="Nutrition" title={simple ? 'Ta journée en portions' : `${c.nutrition.proteinG} g de protéines`} emphasized={order[0] === 'nutrition'} right={<WhyButton explanation={c.nutrition.explanation} compact />}>
        {simple ? (
          <div className="grid grid-cols-4 gap-2 text-center">
            {[['Paumes', c.nutrition.simple.proteinPalms, 'protéines'], ['Poings', c.nutrition.simple.vegFists, 'légumes'], ['Poings', c.nutrition.simple.carbFists, 'glucides'], ['Pouces', c.nutrition.simple.fatThumbs, 'graisses']].map(([u, n, l]) => (
              <div key={String(l)} className="card-2 p-2.5"><div className="text-2xl font-bold tnum">{n}</div><div className="text-[11px] text-ink-3">{u}<br />{l}</div></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2 text-center">
            {[['kcal', c.nutrition.kcal], ['Prot.', c.nutrition.proteinG + ' g'], ['Gluc.', c.nutrition.carbsG + ' g'], ['Lip.', c.nutrition.fatG + ' g']].map(([l, v]) => (
              <div key={String(l)} className="card-2 p-2.5"><div className="text-lg font-bold tnum">{v}</div><div className="text-[11px] text-ink-3">{l}</div></div>
            ))}
          </div>
        )}
        <p className="text-sm text-ink-2">{c.nutrition.strategy}. {c.nutrition.notes[0] ?? ''}</p>
        <Link href="/app/food" className="btn btn-secondary btn-sm self-start">Je mange quoi ? <ArrowRight size={14} /></Link>
      </Card>
    ),
    recovery: (
      <Card key="recovery" accent="recovery" kicker="Récupération" title={c.checkin ? c.recovery.suggestion.split(':')[0] : 'Check-in du jour'} emphasized={order[0] === 'recovery'}>
        <div className="flex items-center gap-5">
          <ScoreRing value={c.recovery.score} size={92} stroke={8} color={accentColor('recovery')} label="Recovery" />
          <div className="text-sm text-ink-2 flex-1">{c.checkin ? c.recovery.suggestion : 'Comment te sens-tu ? 30 secondes, et la séance comme les apports s’adaptent.'}</div>
        </div>
        {!c.checkin && <button className="btn btn-primary btn-sm self-start" onClick={() => setOpen(true)}>Faire mon check-in</button>}
        {c.checkin && <div className="flex flex-wrap gap-1.5">{c.recovery.reasons.map((r) => <span key={r} className="chip pointer-events-none">{r}</span>)}</div>}
      </Card>
    ),
    sleep: (
      <Card key="sleep" accent="vitality" kicker="Sommeil" title={c.review.metrics.sleepAvg ? `${c.review.metrics.sleepAvg} h en moyenne` : 'Objectif ce soir'}>
        <p className="text-sm text-ink-2">Coucher avant 23 h 30, lever régulier. Sous 6,5 h, la faim monte et la perte se déplace vers le muscle.</p>
        <EvidenceBadge id="sleep_and_fat_loss" />
      </Card>
    ),
    movement: (
      <Card key="movement" accent="consistency" kicker="Mouvement" title={c.brief.lines.find((l) => l.label === 'Mouvement')?.value ?? ''}>
        <p className="text-sm text-ink-2">Dépense sans fatigue nerveuse. Pas de 10 000 par défaut : +1 000 par rapport à ton habitude.</p>
        <EvidenceBadge id="steps_neat" />
      </Card>
    ),
    body: null,
  };

  return (
    <div className="space-y-6">
      <header className="rise">
        <div className="label">{fmtDateLong(today())}</div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mt-1">{c.brief.greeting} {c.brief.dayType === 'training' ? 'Jour d’entraînement.' : 'Jour de repos.'}</h1>
        <p className="text-ink-2 mt-2 max-w-2xl">{c.bcs.headline}</p>
      </header>

      <Alerts alerts={c.alerts.slice(0, 2)} />

      {/* Où j'en suis */}
      <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 rise rise-1">
        <div className="card p-5 col-span-2 md:col-span-3 xl:col-span-1 flex items-center gap-4">
          <ScoreRing value={c.bcs.score} size={96} stroke={9} color={accentColor('fat')} label="Body score" />
          <div className="min-w-0"><div className="label">Composition</div><div className="text-sm text-ink-2 mt-1">{c.bcs.trend === 'improving' ? 'En amélioration' : c.bcs.trend === 'stable' ? 'Stable' : c.bcs.trend === 'worsening' ? 'En retrait' : 'Données insuffisantes'}</div></div>
        </div>
        <Kpi label="Tour de taille · 4 sem." value={waist.length ? waist[waist.length - 1]!.value : '—'} unit="cm" badge={<TrendBadge delta={waistDelta} unit=" cm" goodWhen="down" />} data={waist.slice(-10)} color={accentColor('fat')} />
        <Kpi label="Poids (moy. 7 j) · 4 sem." value={w.length ? w[w.length - 1]!.value.toFixed(1) : '—'} unit="kg" badge={<TrendBadge delta={wDelta28} unit=" kg" goodWhen="neutral" />} data={w.slice(-28)} color={accentColor('body')} />
        <Kpi label="Force · 4 sem." value={str.length ? str[str.length - 1]!.value.toFixed(0) : '—'} unit="idx" badge={<TrendBadge delta={strDelta} unit=" %" goodWhen="up" />} data={str.slice(-12)} color={accentColor('muscle')} />
        <div className="card p-5"><div className="label mb-2">Vitalité · Constance</div><div className="flex items-end gap-4 flex-wrap"><Stat size="md" value={c.vitality.score.toFixed(1)} unit="/10" /><Stat size="md" value={adherence === null ? '—' : Math.round(adherence * 100)} unit="%" /></div><div className="text-xs text-ink-3 mt-2">{c.vitality.headline}</div></div>
      </section>

      {/* Les 3 choses qui comptent */}
      <section className="card p-5 md:p-6 rise rise-2">
        <div className="flex items-center justify-between gap-3 mb-3"><div><div className="label">Ton plan du jour</div><h2 className="font-bold text-lg">Les 3 choses qui auront le plus d’impact</h2></div>{!c.checkin && <button className="btn btn-secondary btn-sm" onClick={() => setOpen(true)}>Check-in 30 s</button>}</div>
        <ol className="grid md:grid-cols-3 gap-3">
          {c.brief.topThree.map((t, i) => <li key={t} className="card-2 p-4 flex gap-3"><span className="w-7 h-7 rounded-full bg-ink text-bg grid place-items-center text-sm font-bold shrink-0">{i + 1}</span><span className="text-sm">{t}</span></li>)}
        </ol>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mt-4">
          {c.brief.lines.map((l) => <div key={l.label} className="text-sm"><div className="label">{l.label}</div><div className="font-medium mt-0.5">{l.value}</div></div>)}
        </div>
      </section>

      {/* Bento adaptatif */}
      <section className="grid md:grid-cols-3 gap-4 rise rise-3">
        {order.map((k) => cards[k])}
      </section>

      <section className="grid md:grid-cols-2 gap-4 rise rise-4">
        {c.currentWeek && c.currentPhase && c.weekSummary && (
          <Card kicker={`Programme · semaine ${c.currentWeek.weekNumber}/${c.plan.weeksTotal}`} title={`${c.currentPhase.name} — ${c.currentPhase.focus}`} accent="body" right={<Link href="/app/plan" className="text-sm font-medium text-ink-2 hover:text-ink">Planning</Link>}>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 7 }, (_, i) => addDays(c.currentWeek!.startDate, i)).map((d, i) => {
                const s = c.currentWeek!.sessions.find((x) => x.date === d);
                const done = s && state.sessions.some((x) => x.date === d && x.completed);
                return <div key={d} className={cx('rounded-lg p-1.5 text-center text-[11px]', d === today() ? 'ring-2 ring-[var(--accent-body)]' : '', s ? 'card-2' : 'opacity-50')}><div className="text-ink-3 uppercase">{['L', 'M', 'M', 'J', 'V', 'S', 'D'][i]}</div><div className={cx('font-semibold truncate', done && 'text-[var(--accent-vitality)]')}>{s ? (done ? '✓' : s.name.replace('Full Body ', 'FB ')) : c.currentWeek!.measurementDate === d ? 'Mesures' : '—'}</div></div>;
              })}
            </div>
            <p className="text-sm text-ink-2">{c.weekSummary.sessionsDone}/{c.weekSummary.sessionsPlanned} séances faites{c.weekSummary.pending.length ? ` · à faire : ${c.weekSummary.pending.join(', ')}` : ''}.</p>
          </Card>
        )}
        <Card kicker="Cette semaine" title="Micro-habitudes" accent="consistency">
          <ul className="space-y-2">{c.habits.map((h) => <li key={h.id} className="flex items-start gap-3 text-sm"><Check size={16} className="mt-0.5 text-ink-3" /><div><div className="font-medium">{h.text}</div><div className="text-ink-2">{h.why}</div></div></li>)}</ul>
        </Card>
        <Card kicker="Bilan" title={c.review.headline} accent="body" right={<Link href="/app/review" className="text-sm font-medium text-ink-2 hover:text-ink">Voir</Link>}>
          {c.review.keep[0] && <p className="text-sm"><span className="font-semibold">Ce qu’on ne change pas : </span>{c.review.keep[0].text} <span className="text-ink-2">{c.review.keep[0].why}</span></p>}
          {c.review.change[0] && <p className="text-sm"><span className="font-semibold">Ce qu’on change : </span>{c.review.change[0].text}</p>}
        </Card>
      </section>

      <Sheet open={open} onClose={() => setOpen(false)} title="Comment te sens-tu aujourd’hui ?">
        <div className="space-y-4">
          <SliderField label="Énergie" value={ck.energy} onChange={(v) => setCk({ ...ck, energy: v })} low="Épuisé" high="Plein d’énergie" />
          <SliderField label="Heures de sommeil" value={ck.sleepHours} min={3} max={10} step={0.5} onChange={(v) => setCk({ ...ck, sleepHours: v })} format={(v) => `${v} h`} />
          <SliderField label="Qualité du sommeil" value={ck.sleepQuality} onChange={(v) => setCk({ ...ck, sleepQuality: v })} low="Mauvaise" high="Excellente" />
          <SliderField label="Stress" value={ck.stress} onChange={(v) => setCk({ ...ck, stress: v })} low="Serein" high="Sous pression" />
          <SliderField label="Courbatures / fatigue musculaire" value={ck.soreness} onChange={(v) => setCk({ ...ck, soreness: v })} low="Aucune" high="Fortes" />
          <SliderField label="Motivation" value={ck.motivation} onChange={(v) => setCk({ ...ck, motivation: v })} low="Basse" high="Haute" />
          <SliderField label="Faim" value={ck.hunger} onChange={(v) => setCk({ ...ck, hunger: v })} low="Peu" high="Très" />
          <SliderField label="Humeur" value={ck.mood} onChange={(v) => setCk({ ...ck, mood: v })} low="Basse" high="Bonne" />
          <label className="block"><span className="text-sm font-medium">Pas hier (facultatif)</span><input className="input mt-1" type="number" placeholder="ex. 7200" value={ck.steps ?? ''} onChange={(e) => setCk({ ...ck, steps: e.target.value ? Number(e.target.value) : undefined })} /></label>
          <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={pain} onChange={(e) => { setPain(e.target.checked); setCk({ ...ck, pain: e.target.checked ? { region: 'shoulder', severity: 3, unusual: true } : null }); }} /> Douleur inhabituelle (pas une courbature)</label>
          {pain && ck.pain && (
            <div className="grid grid-cols-2 gap-3">
              <select className="input" value={ck.pain.region} onChange={(e) => setCk({ ...ck, pain: { ...ck.pain!, region: e.target.value as NonNullable<DailyCheckin['pain']>['region'] } })}>
                {['shoulder', 'elbow', 'wrist', 'lower_back', 'hip', 'knee', 'ankle', 'neck'].map((r) => <option key={r} value={r}>{({ shoulder: 'Épaule', elbow: 'Coude', wrist: 'Poignet', lower_back: 'Bas du dos', hip: 'Hanche', knee: 'Genou', ankle: 'Cheville', neck: 'Cou' } as Record<string, string>)[r]}</option>)}
              </select>
              <SliderField label="Intensité" value={ck.pain.severity} onChange={(v) => setCk({ ...ck, pain: { ...ck.pain!, severity: v as 1 | 2 | 3 | 4 | 5 } })} />
            </div>
          )}
          <button className="btn btn-primary w-full" onClick={() => { upsertCheckin(ck); setOpen(false); }}>Enregistrer et adapter ma journée</button>
        </div>
      </Sheet>
    </div>
  );
}

function Kpi({ label, value, unit, badge, data, color }: { label: string; value: React.ReactNode; unit: string; badge: React.ReactNode; data: { date: string; value: number }[]; color: string }) {
  return (
    <div className="card p-5 flex flex-col gap-2">
      <div className="label">{label}</div>
      <Stat size="md" value={value} unit={unit} />
      <div>{badge}</div>
      <Sparkline data={data} color={color} height={36} />
    </div>
  );
}

