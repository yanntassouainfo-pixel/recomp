'use client';
import { useState } from 'react';
import { monthlyReport, type ReviewItem } from '@recomp/engine';
import { Card, accentColor } from '@/components/ui/Card';
import { Segmented } from '@/components/ui/Primitives';
import { EvidenceBadge, WhyButton } from '@/components/ui/Evidence';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { useComputed } from '@/lib/useComputed';
import { today } from '@/lib/store';
import { fmtDate } from '@/lib/format';

function Items({ items, tone }: { items: ReviewItem[]; tone: 'good' | 'bad' | 'change' | 'keep' }) {
  if (!items.length) return <p className="text-sm text-ink-3">—</p>;
  return (
    <ul className="space-y-3">
      {items.map((it) => (
        <li key={it.text} className="text-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="font-medium">{it.text}</div>
            {it.evidenceId && <WhyButton compact evidenceId={it.evidenceId} explanation={{ logic: it.why }} />}
          </div>
          <div className="text-ink-2 mt-0.5">{it.why}</div>
        </li>
      ))}
    </ul>
  );
}

export default function Review() {
  const { state, computed: c } = useComputed();
  const [tab, setTab] = useState<'week' | 'month'>('week');
  if (!state || !c) return null;
  const r = c.review;
  const m = r.metrics;
  const report = monthlyReport(state, today());
  const metric = (l: string, v: string | number | null, unit = '') => <div className="card-2 p-3"><div className="text-xs text-ink-3">{l}</div><div className="font-bold tnum text-lg">{v === null ? '—' : `${v}${unit}`}</div></div>;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4 rise">
        <div>
          <div className="label">Bilans</div>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1">{tab === 'week' ? 'Ton bilan de la semaine' : 'Your Body Report'}</h1>
          <p className="text-ink-2 mt-1 max-w-2xl">{tab === 'week' ? r.headline : report.conclusion}</p>
        </div>
        <Segmented value={tab} onChange={setTab} options={[{ value: 'week', label: 'Semaine' }, { value: 'month', label: 'Mois' }]} />
      </header>

      {tab === 'week' && (
        <>
          <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2 rise rise-1">
            {metric('Poids moyen', m.weightAvg, ' kg')}
            {metric('Δ poids / sem.', m.weightDelta !== null ? (m.weightDelta > 0 ? '+' : '') + m.weightDelta : null, ' kg')}
            {metric('Δ taille / 4 sem.', m.waistDelta !== null ? (m.waistDelta > 0 ? '+' : '') + m.waistDelta : null, ' cm')}
            {metric('Force / 4 sem.', m.strengthDeltaPct !== null ? (m.strengthDeltaPct > 0 ? '+' : '') + m.strengthDeltaPct : null, ' %')}
            {metric('Adhérence', m.adherence !== null ? Math.round(m.adherence * 100) : null, ' %')}
            {metric('Sommeil', m.sleepAvg, ' h')}
            {metric('Énergie', m.energyAvg, '/5')}
            {metric('Faim', m.hungerAvg, '/5')}
          </section>
          {!r.decisionWindowOk && <div className="card-2 border-l-4 border-l-[var(--accent-body)] px-4 py-3 text-sm">Fenêtre de décision non atteinte : le moteur ne révise une stratégie qu’avec 14 jours de données et une adhérence ≥ 70 %. <EvidenceBadge id="weight_noise" className="ml-2" /></div>}
          <section className="grid md:grid-cols-2 gap-4 rise rise-2">
            <Card accent="vitality" kicker="01" title="Ce qui fonctionne"><Items items={r.works} tone="good" /></Card>
            <Card accent="muscle" kicker="02" title="Ce qui bloque"><Items items={r.blocks} tone="bad" /></Card>
            <Card accent="body" kicker="03" title="Ce qu’on change"><Items items={r.change} tone="change" />{r.energyAdjustment !== 0 && <div className="text-xs text-ink-3">Ajustement énergétique appliqué dès demain : {r.energyAdjustment > 0 ? '+' : ''}{Math.round(r.energyAdjustment * 100)} %.</div>}</Card>
            <Card accent="consistency" kicker="04" title="Ce qu’on ne change pas" emphasized><Items items={r.keep} tone="keep" /><p className="text-xs text-ink-3">Savoir ne rien changer quand les données disent que ça marche est la décision la plus difficile — et la plus rentable.</p></Card>
          </section>
          <section className="grid md:grid-cols-2 gap-4 rise rise-3">
            <Card kicker="Plateau detector" title={c.plateau.kind === 'true_plateau' ? 'Plateau confirmé' : c.plateau.kind === 'progressing' ? 'Pas de plateau : tu progresses' : c.plateau.kind === 'pseudo_plateau' ? 'Pseudo-plateau' : 'Trop tôt pour conclure'}>
              <ul className="text-sm text-ink-2 list-disc pl-4 space-y-1">{c.plateau.reasons.map((x) => <li key={x}>{x}</li>)}</ul>
              <p className="text-sm font-medium">{c.plateau.recommendation}</p>
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="card-2 p-2"><div className="font-bold tnum">{c.plateau.signals.weightPctPerWeek ?? '—'}</div>% poids/sem</div>
                <div className="card-2 p-2"><div className="font-bold tnum">{c.plateau.signals.waistDeltaCm ?? '—'}</div>cm taille</div>
                <div className="card-2 p-2"><div className="font-bold tnum">{c.plateau.signals.strengthSlope ?? '—'}</div>force/sem</div>
                <div className="card-2 p-2"><div className="font-bold tnum">{c.plateau.signals.adherence !== null ? Math.round(c.plateau.signals.adherence * 100) + '%' : '—'}</div>adhérence</div>
              </div>
            </Card>
            <Card kicker="Journal des décisions" title="La mémoire explicable du coach">
              <ul className="space-y-2.5 text-sm">
                {[...state.decisions].reverse().slice(0, 6).map((d) => (
                  <li key={d.date + d.summary} className="border-l-2 border-line pl-3"><div className="text-xs text-ink-3 tnum">{fmtDate(d.date)}</div><div className="font-medium">{d.summary}</div><div className="text-ink-2">{d.why}</div></li>
                ))}
              </ul>
            </Card>
          </section>
        </>
      )}

      {tab === 'month' && (
        <>
          <section className="grid grid-cols-2 md:grid-cols-3 gap-3 rise rise-1">
            {report.sections.map((s) => (
              <Card key={s.key} accent={s.key === 'fat' ? 'fat' : s.key === 'muscle' || s.key === 'strength' ? 'muscle' : s.key === 'sleep' || s.key === 'vitality' ? 'vitality' : s.key === 'recovery' ? 'recovery' : s.key === 'consistency' ? 'consistency' : s.key === 'nutrition' ? 'nutrition' : 'body'} kicker={s.title} title={s.value}>
                <p className="text-sm text-ink-2">{s.text}</p>
              </Card>
            ))}
          </section>
          <section className="card p-6 md:p-8 rise rise-2 grid md:grid-cols-[auto_1fr] gap-6 items-center">
            <ScoreRing value={c.bcs.score} size={140} stroke={12} color={accentColor('fat')} label="Body score" />
            <div>
              <div className="label mb-2">Voici ce que nous avons appris sur ton corps ce mois-ci</div>
              <ul className="space-y-2">{report.learned.map((l) => <li key={l} className="text-[15px] flex gap-3"><span className="text-ink-3">—</span>{l}</li>)}</ul>
              <p className="mt-4 font-semibold">{report.conclusion}</p>
              <p className="text-xs text-ink-3 mt-2">Période : {fmtDate(report.from)} → {fmtDate(report.to)}</p>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
