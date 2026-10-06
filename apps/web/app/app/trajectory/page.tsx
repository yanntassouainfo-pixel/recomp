'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Area, CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Camera, Flag, Target, Pause } from 'lucide-react';
import { projectLongTerm } from '@recomp/engine';
import { Card, accentColor } from '@/components/ui/Card';
import { Segmented } from '@/components/ui/Primitives';
import { EvidenceBadge } from '@/components/ui/Evidence';
import { useComputed } from '@/lib/useComputed';
import { today } from '@/lib/store';
import { fmtDate } from '@/lib/format';

export default function Trajectory() {
  const { state, computed: c } = useComputed();
  const [months, setMonths] = useState<6 | 12>(6);
  const [scenario, setScenario] = useState<'current' | 'consistent'>('current');
  const proj = useMemo(() => (state ? projectLongTerm(state, today(), months, scenario) : null), [state, months, scenario]);
  const alt = useMemo(() => (state ? projectLongTerm(state, today(), months, scenario === 'current' ? 'consistent' : 'current') : null), [state, months, scenario]);
  if (!state || !c || !proj || !alt) return null;
  const data = proj.points.map((p, i) => ({ date: p.date, m: Math.round(i / 4.33), waist: p.waistCm, weight: p.weightKg, band: [p.weightLow, p.weightHigh] as [number, number], strength: p.strengthIdx, altWaist: alt.points[i]?.waistCm }));
  const monthTick = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('fr-FR', { month: 'short' });
  const goalIcon = { photos: Camera, report: Camera, block: Flag, goal: Target, maintenance: Pause } as const;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4 rise">
        <div>
          <div className="label">Trajectoire</div>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1">Où tu seras dans {months} mois</h1>
          <p className="text-ink-2 mt-1 max-w-2xl">Un couloir calculé à partir de tes 4 dernières semaines et des rythmes de référence, pas une promesse. Il se recalcule chaque semaine.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Segmented value={String(months) as '6' | '12'} onChange={(v) => setMonths(v === '12' ? 12 : 6)} options={[{ value: '6', label: '6 mois' }, { value: '12', label: '12 mois' }]} />
          <Segmented value={scenario} onChange={setScenario} options={[{ value: 'current', label: 'Comme maintenant' }, { value: 'consistent', label: 'Régulier (90 %)' }]} />
        </div>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 rise rise-1">
        <div className="card p-5"><div className="label">Tour de taille</div><div className="text-3xl font-bold tnum mt-1">{proj.summary.waistAt} <span className="text-base text-ink-2 font-medium">cm</span></div><div className="text-sm text-ink-2 tnum">{proj.summary.waistDeltaCm > 0 ? '+' : ''}{proj.summary.waistDeltaCm} cm</div></div>
        <div className="card p-5"><div className="label">Poids</div><div className="text-3xl font-bold tnum mt-1">{proj.summary.weightAt} <span className="text-base text-ink-2 font-medium">kg</span></div><div className="text-sm text-ink-2 tnum">{proj.summary.weightDeltaKg > 0 ? '+' : ''}{proj.summary.weightDeltaKg} kg · fourchette {proj.points[proj.points.length - 1]!.weightLow}–{proj.points[proj.points.length - 1]!.weightHigh}</div></div>
        <div className="card p-5"><div className="label">Force</div><div className="text-3xl font-bold tnum mt-1">{proj.summary.strengthDeltaPct > 0 ? '+' : ''}{proj.summary.strengthDeltaPct} <span className="text-base text-ink-2 font-medium">%</span></div><div className="text-sm text-ink-2">mouvements clés</div></div>
        <div className="card p-5"><div className="label">Régularité supposée</div><div className="text-3xl font-bold tnum mt-1">{Math.round(proj.adherenceAssumed * 100)} <span className="text-base text-ink-2 font-medium">%</span></div><div className="text-sm text-ink-2">{scenario === 'current' ? 'ton rythme des 4 dernières semaines' : 'scénario régulier'}</div></div>
      </section>

      <Card kicker="Couloir de progression" title="Tour de taille et poids, semaine par semaine" accent="fat" right={<EvidenceBadge id={proj.evidenceId} />}>
        <div style={{ height: 300 }}>
          <ResponsiveContainer>
            <ComposedChart data={data} margin={{ top: 10, right: 12, bottom: 0, left: -10 }}>
              <CartesianGrid stroke="var(--line)" vertical={false} />
              <XAxis dataKey="date" tickFormatter={monthTick} tick={{ fill: 'var(--ink-3)', fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={40} />
              <YAxis yAxisId="w" domain={['dataMin - 2', 'dataMax + 2']} tick={{ fill: 'var(--ink-3)', fontSize: 11 }} axisLine={false} tickLine={false} width={44} />
              <YAxis yAxisId="c" orientation="right" domain={['dataMin - 2', 'dataMax + 2']} tick={{ fill: 'var(--ink-3)', fontSize: 11 }} axisLine={false} tickLine={false} width={44} />
              <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, fontSize: 12 }} labelFormatter={(l) => fmtDate(String(l))} formatter={((v: unknown, name: unknown) => [Array.isArray(v) ? `${v[0]}–${v[1]} kg` : `${v}${name === 'waist' || name === 'altWaist' ? ' cm' : name === 'weight' ? ' kg' : ''}`, name === 'waist' ? 'Tour de taille' : name === 'altWaist' ? `Taille (${scenario === 'current' ? 'régulier' : 'comme maintenant'})` : name === 'weight' ? 'Poids' : name === 'band' ? 'Fourchette' : String(name)]) as never} />
              <Area yAxisId="w" dataKey="band" stroke="none" fill={accentColor('body')} fillOpacity={0.12} isAnimationActive={false} />
              <Line yAxisId="w" dataKey="weight" stroke={accentColor('body')} strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line yAxisId="c" dataKey="waist" stroke={accentColor('fat')} strokeWidth={2.5} dot={false} isAnimationActive={false} />
              <Line yAxisId="c" dataKey="altWaist" stroke={accentColor('fat')} strokeWidth={1.5} strokeDasharray="4 4" dot={false} isAnimationActive={false} />
              {proj.milestones.filter((m) => m.kind === 'goal').map((m) => <ReferenceLine key={m.date} yAxisId="w" x={m.date} stroke={accentColor('vitality')} strokeDasharray="3 3" />)}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap gap-4 text-xs text-ink-2">
          <span className="inline-flex items-center gap-1.5"><span className="w-3 h-0.5" style={{ background: accentColor('fat') }} />Tour de taille (cm, axe droit)</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-3 h-0.5 border-t border-dashed" style={{ borderColor: accentColor('fat') }} />Autre scénario</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-3 h-0.5" style={{ background: accentColor('body') }} />Poids (kg, axe gauche) et fourchette</span>
        </div>
        <ul className="space-y-1.5 text-sm">{proj.narrative.map((n) => <li key={n}>{n}</li>)}</ul>
      </Card>

      <section className="grid md:grid-cols-[1.2fr_0.8fr] gap-4 rise rise-2">
        <Card kicker="Les blocs à venir" title="Comment les mois s’enchaînent" accent="muscle">
          <div className="flex w-full h-3 rounded-full overflow-hidden gap-0.5">
            {proj.blocks.map((b) => <div key={b.index} title={b.name} style={{ flex: 1, background: b.name.startsWith('Maintenance') ? 'var(--accent-recovery)' : b.index % 2 ? 'var(--accent-muscle)' : 'var(--accent-body)', opacity: 0.8 }} />)}
          </div>
          <ol className="space-y-3">
            {proj.blocks.map((b) => (
              <li key={b.index} className="card-2 p-3 text-sm">
                <div className="flex items-center justify-between gap-3"><span className="font-semibold">{b.name}</span><span className="text-xs text-ink-3 tnum">{fmtDate(b.startDate)} → {fmtDate(b.endDate)}</span></div>
                <div className="text-xs text-ink-2 mt-1">{b.phases.map((p) => `${p.name} (${p.weeks} sem.)`).join(' · ')}</div>
                {b.focus && <div className="text-xs text-ink-3 mt-1">{b.focus}</div>}
              </li>
            ))}
          </ol>
          <p className="text-xs text-ink-3">Chaque bloc se termine par des photos et un rapport. Après chaque bloc, le moteur redécide : continuer, maintenir, ou changer d’objectif.</p>
        </Card>
        <Card kicker="Jalons" title="Ce qui t’attend" accent="consistency">
          <ul className="space-y-2 text-sm">
            {proj.milestones.slice(0, 12).map((m) => { const Icon = goalIcon[m.kind]; return <li key={m.date + m.label} className="flex items-center gap-3"><Icon size={14} className="text-ink-3 shrink-0" /><span className="tnum text-ink-3 w-16 shrink-0">{fmtDate(m.date)}</span><span className={m.kind === 'goal' ? 'font-semibold' : ''}>{m.label}</span></li>; })}
          </ul>
          <div className="card-2 p-3 text-xs text-ink-2 space-y-1">{proj.caveats.map((x) => <p key={x}>{x}</p>)}</div>
          <Link href="/app/plan" className="btn btn-secondary btn-sm self-start">Voir le planning des 12 semaines</Link>
        </Card>
      </section>
    </div>
  );
}
