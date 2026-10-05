'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Camera, CalendarDays, Check, ChevronLeft, ChevronRight, Dumbbell, Ruler, Flag, X } from 'lucide-react';
import { buildCalendar, addDays, type CalendarEvent, type EventKind } from '@recomp/engine';
import { Card } from '@/components/ui/Card';
import { EvidenceBadge, WhyButton } from '@/components/ui/Evidence';
import { useComputed } from '@/lib/useComputed';
import { today } from '@/lib/store';
import { cx, fmtDate } from '@/lib/format';

const KIND_STYLE: Record<EventKind, { color: string; label: string }> = {
  session: { color: 'var(--accent-muscle)', label: 'Séance' },
  measure: { color: 'var(--accent-fat)', label: 'Mesures' },
  photos: { color: 'var(--accent-body)', label: 'Photos' },
  review: { color: 'var(--accent-consistency)', label: 'Bilan' },
  deload: { color: 'var(--accent-recovery)', label: 'Semaine allégée' },
  diet_break: { color: 'var(--accent-nutrition)', label: 'Pause diète' },
  phase: { color: 'var(--accent-vitality)', label: 'Nouvelle phase' },
  life_event: { color: 'var(--ink-3)', label: 'Vie' },
  end: { color: 'var(--accent-vitality)', label: 'Fin du bloc' },
};

const PHASE_COLOR: Record<string, string> = { foundation: 'var(--accent-vitality)', build: 'var(--accent-muscle)', intensify: 'var(--accent-body)', deload: 'var(--accent-recovery)', diet_break: 'var(--accent-nutrition)', consolidate: 'var(--accent-fat)', routine: 'var(--accent-consistency)' };

function monthStart(iso: string) { return iso.slice(0, 7) + '-01'; }
function shiftMonth(iso: string, n: number) { const d = new Date(iso + 'T00:00:00'); d.setMonth(d.getMonth() + n, 1); return d.toISOString().slice(0, 10); }
function daysInMonth(iso: string) { const d = new Date(iso + 'T00:00:00'); return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); }

export default function Plan() {
  const { state, computed: c } = useComputed();
  const [month, setMonth] = useState(monthStart(today()));
  const [selected, setSelected] = useState<string | null>(null);
  const t = today();
  const events = useMemo(() => (state && c ? buildCalendar(state, c.plan, addDays(month, -7), addDays(month, 45), t) : []), [state, c, month, t]);
  if (!state || !c) return null;
  const plan = c.plan;
  const week = c.currentWeek;
  const phase = c.currentPhase;
  const ws = c.weekSummary;

  const firstDow = (new Date(month + 'T00:00:00').getDay() + 6) % 7; // lundi = 0
  const nDays = daysInMonth(month);
  const cells: (string | null)[] = [...Array(firstDow).fill(null), ...Array.from({ length: nDays }, (_, i) => addDays(month, i))];
  while (cells.length % 7) cells.push(null);
  const byDate = (d: string) => events.filter((e) => e.date === d);
  const monthLabel = new Date(month + 'T00:00:00').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const selEvents = selected ? byDate(selected) : [];
  const weekEvents = week ? events.filter((e) => e.date >= week.startDate && e.date <= week.endDate) : [];
  const progressPct = Math.round(((week?.weekNumber ?? 0) / plan.weeksTotal) * 100);

  return (
    <div className="space-y-6">
      <header className="rise">
        <div className="label">Planning</div>
        <h1 className="text-3xl font-extrabold tracking-tight mt-1">Ton programme, semaine par semaine</h1>
        <p className="text-ink-2 mt-1 max-w-2xl">{plan.goalStatement}</p>
      </header>

      {/* Frise des phases */}
      <Card kicker={`Bloc de ${plan.weeksTotal} semaines · du ${fmtDate(plan.startDate)} au ${fmtDate(plan.endDate)}`} title={phase ? `Semaine ${week?.weekNumber} · ${phase.name}` : 'Bloc terminé'} accent="body" right={phase && <WhyButton evidenceId={phase.evidenceId} explanation={{ context: phase.focus, logic: phase.description, expectedBenefit: phase.why }} />}>
        <div className="flex w-full h-3 rounded-full overflow-hidden gap-0.5">
          {plan.phases.map((p) => <div key={p.id} title={`${p.name} · ${p.weeks} sem.`} style={{ flex: p.weeks, background: PHASE_COLOR[p.intent], opacity: phase?.id === p.id ? 1 : 0.45 }} />)}
        </div>
        <div className="relative h-2 -mt-1"><div className="absolute top-0 w-0.5 h-3 bg-ink rounded" style={{ left: `calc(${progressPct}% - 1px)` }} /></div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-2">
          {plan.phases.map((p) => (
            <div key={p.id} className={cx('card-2 p-3 text-sm border-l-4', phase?.id === p.id && 'ring-1 ring-[var(--line)]')} style={{ borderLeftColor: PHASE_COLOR[p.intent] }}>
              <div className="flex items-center justify-between gap-2"><span className="font-semibold">{p.name}</span><span className="text-xs text-ink-3 tnum">{p.weeks} sem.</span></div>
              <div className="text-xs text-ink-2 mt-0.5">{p.focus}</div>
              <div className="text-[11px] text-ink-3 mt-1 tnum">Volume ×{p.volumeMultiplier.toFixed(2)} · RIR {p.rirTarget} · {p.nutritionMode === 'maintenance' ? 'maintenance' : 'cibles du plan'}</div>
            </div>
          ))}
        </div>
        {phase && <p className="text-sm text-ink-2">{phase.description}</p>}
        <div className="flex flex-wrap gap-2"><EvidenceBadge id="periodization" /><EvidenceBadge id="training_frequency" />{plan.phases.some((p) => p.intent === 'diet_break') && <EvidenceBadge id="diet_break" />}</div>
      </Card>

      {/* Cette semaine */}
      {week && ws && (
        <section className="grid md:grid-cols-[1.2fr_0.8fr] gap-4 rise rise-1">
          <Card kicker={`Semaine ${week.weekNumber} · ${fmtDate(week.startDate)} → ${fmtDate(week.endDate)}`} title="Cette semaine" accent="muscle" right={<span className="text-sm tnum text-ink-2">{ws.sessionsDone}/{ws.sessionsPlanned} séances</span>}>
            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: 7 }, (_, i) => addDays(week.startDate, i)).map((d) => {
                const evs = weekEvents.filter((e) => e.date === d);
                const isToday = d === t;
                return (
                  <button key={d} onClick={() => setSelected(d)} className={cx('card-2 p-2 text-left min-h-[88px] flex flex-col gap-1 transition-colors hover:bg-line', isToday && 'ring-2 ring-[var(--accent-body)]')}>
                    <div className="text-[11px] text-ink-3 uppercase">{['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim'][i(d, week.startDate)]} <span className="tnum">{d.slice(8)}</span></div>
                    {evs.map((e) => <EventPill key={e.id} e={e} compact />)}
                  </button>
                );
              })}
            </div>
            {week.notes.map((n) => <p key={n} className="text-sm text-ink-2 card-2 p-3">{n}</p>)}
            <div className="flex flex-wrap items-center gap-3 text-sm">
              {ws.nextSession ? <Link href="/app/train" className="btn btn-primary btn-sm">Prochaine séance : {ws.nextSession.name} ({ws.nextSession.date === t ? 'aujourd’hui' : fmtDate(ws.nextSession.date)}) <ArrowRight size={14} /></Link> : <span className="chip pointer-events-none"><Check size={14} /> Séances de la semaine faites</span>}
              {ws.pending.length > 0 && <span className="text-ink-2">À faire : {ws.pending.join(' · ')}.</span>}
            </div>
          </Card>
          <Card kicker="Jalons" title="Ce qui arrive" accent="consistency">
            <ul className="space-y-2 text-sm">
              {plan.milestones.filter((m) => m.date >= t).slice(0, 6).map((m) => (
                <li key={m.date + m.kind} className="flex items-center gap-3"><span className="w-2 h-2 rounded-full shrink-0" style={{ background: KIND_STYLE[m.kind === 'phase' ? 'phase' : m.kind].color }} /><span className="tnum text-ink-3 w-14 shrink-0">{fmtDate(m.date)}</span><span>{m.label}</span></li>
              ))}
            </ul>
            <p className="text-xs text-ink-3">Mesures chaque dimanche, photos toutes les 4 semaines, bilan hebdomadaire le dimanche. Le coach ne change la stratégie qu’avec 14 jours de données.</p>
          </Card>
        </section>
      )}

      {/* Calendrier mensuel */}
      <Card kicker="Calendrier" title={monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)} accent="fat" right={<div className="flex gap-1"><button className="btn btn-ghost btn-sm" onClick={() => setMonth(shiftMonth(month, -1))} aria-label="Mois précédent"><ChevronLeft size={16} /></button><button className="btn btn-ghost btn-sm" onClick={() => setMonth(monthStart(t))}>Aujourd’hui</button><button className="btn btn-ghost btn-sm" onClick={() => setMonth(shiftMonth(month, 1))} aria-label="Mois suivant"><ChevronRight size={16} /></button></div>}>
        <div className="grid grid-cols-7 gap-1 text-[11px] text-ink-3 uppercase px-1">{['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((d) => <div key={d}>{d}</div>)}</div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, k) => {
            if (!d) return <div key={k} />;
            const evs = byDate(d);
            const inPlan = d >= plan.startDate && d <= plan.endDate;
            const isToday = d === t;
            return (
              <button key={d} onClick={() => setSelected(d)} className={cx('rounded-[12px] p-1.5 min-h-[64px] md:min-h-[84px] text-left flex flex-col gap-1 transition-colors', inPlan ? 'card-2 hover:bg-line' : 'opacity-50', isToday && 'ring-2 ring-[var(--accent-body)]', selected === d && 'bg-line')}>
                <div className={cx('text-xs tnum', isToday ? 'font-bold' : 'text-ink-2')}>{Number(d.slice(8))}</div>
                <div className="flex flex-wrap gap-1">{evs.slice(0, 4).map((e) => <span key={e.id} title={`${KIND_STYLE[e.kind].label} : ${e.title}`} className={cx('w-2 h-2 rounded-full', e.status === 'missed' && 'opacity-40', e.status === 'done' && 'ring-1 ring-offset-1 ring-[var(--ink-3)] ring-offset-[var(--surface-2)]')} style={{ background: KIND_STYLE[e.kind].color }} />)}</div>
                <div className="hidden md:block text-[11px] leading-tight text-ink-2 truncate">{evs[0]?.kind === 'session' ? evs[0].title : evs.find((e) => e.kind !== 'session')?.title ?? ''}</div>
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-ink-2">
          {(['session', 'measure', 'photos', 'review', 'deload', 'diet_break', 'phase'] as EventKind[]).map((k) => <span key={k} className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: KIND_STYLE[k].color }} />{KIND_STYLE[k].label}</span>)}
          <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-ink-3 opacity-40" />manqué</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-ink-3 ring-1 ring-offset-1 ring-[var(--ink-3)] ring-offset-[var(--surface)]" />fait</span>
        </div>
      </Card>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/30 md:p-6" onClick={() => setSelected(null)}>
          <div className="card w-full md:max-w-md p-6 rounded-b-none md:rounded-b-[var(--radius-card)] rise" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3 mb-3"><h3 className="font-bold text-lg capitalize">{new Date(selected + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</h3><button className="btn btn-ghost btn-sm -mr-2" onClick={() => setSelected(null)} aria-label="Fermer"><X size={18} /></button></div>
            {selEvents.length === 0 ? <p className="text-sm text-ink-2">Jour de repos : marche, mobilité, un vrai dîner. Rien à cocher.</p> : (
              <ul className="space-y-2">{selEvents.map((e) => <li key={e.id}><EventPill e={e} /></li>)}</ul>
            )}
            {selEvents.some((e) => e.kind === 'session' && e.date === t) && <Link href="/app/train" className="btn btn-primary w-full mt-4">Ouvrir la séance du jour <ArrowRight size={14} /></Link>}
            {selEvents.some((e) => e.kind === 'measure') && <Link href="/app/body" className="btn btn-secondary w-full mt-2">Saisir les mesures</Link>}
          </div>
        </div>
      )}
    </div>
  );
}

function i(d: string, start: string) { return Math.round((Date.parse(d) - Date.parse(start)) / 86_400_000); }

function EventPill({ e, compact }: { e: CalendarEvent; compact?: boolean }) {
  const Icon = e.kind === 'session' ? Dumbbell : e.kind === 'measure' ? Ruler : e.kind === 'photos' ? Camera : e.kind === 'review' ? CalendarDays : Flag;
  const style = KIND_STYLE[e.kind];
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-lg px-1.5 py-1 text-[11px] leading-tight w-full', compact ? '' : 'text-sm py-2 px-3', e.status === 'missed' && 'opacity-50 line-through', e.status === 'done' && 'font-semibold')} style={{ background: `color-mix(in srgb, ${style.color} 14%, transparent)`, color: `color-mix(in srgb, ${style.color} 70%, var(--ink))` }}>
      {e.status === 'done' ? <Check size={compact ? 11 : 14} /> : <Icon size={compact ? 11 : 14} />}
      <span className="truncate">{e.title}{!compact && e.detail ? ` — ${e.detail}` : ''}</span>
      {!compact && <span className="ml-auto text-[11px] opacity-70">{e.status === 'done' ? 'fait' : e.status === 'missed' ? 'manqué' : e.status === 'today' ? 'aujourd’hui' : 'prévu'}</span>}
    </span>
  );
}
