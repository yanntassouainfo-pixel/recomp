'use client';
import { useState } from 'react';
import { Check, Replace } from 'lucide-react';
import { EXERCISE_BY_ID, substitutesFor, type PerformanceLog, type SetLog, type WorkoutDay } from '@recomp/engine';
import { Card } from '@/components/ui/Card';
import { Segmented, Sheet } from '@/components/ui/Primitives';
import { EvidenceBadge, WhyButton } from '@/components/ui/Evidence';
import { useComputed } from '@/lib/useComputed';
import { today, useStore } from '@/lib/store';

export default function Train() {
  const { state, computed: c } = useComputed();
  const addPerformance = useStore((s) => s.addPerformance);
  const upsertSession = useStore((s) => s.upsertSession);
  const [tab, setTab] = useState<'today' | 'program' | 'history'>('today');
  const draft = useStore((s) => s.draft);
  const setDraft = useStore((s) => s.setDraft);
  const logs = draft && draft.date === today() ? draft.logs : {};
  const subs = draft && draft.date === today() ? draft.subs : {};
  const setLogs = (l: Record<string, SetLog[]>) => setDraft({ date: today(), logs: l, subs });
  const setSubs = (sb: Record<string, string>) => setDraft({ date: today(), logs, subs: sb });
  const [subOpen, setSubOpen] = useState<string | null>(null);
  if (!state || !c) return null;
  const p = state.profile;
  const day = c.todayWorkout;
  const session = c.session;
  const todaySession = state.sessions.find((s) => s.date === today());

  const finish = () => {
    if (!day) return;
    for (const [exId, sets] of Object.entries(logs)) {
      const valid = sets.filter((s) => s.reps > 0);
      if (valid.length) addPerformance({ date: today(), exerciseId: subs[exId] ?? exId, sets: valid } satisfies PerformanceLog);
    }
    upsertSession({ id: 'sess_' + today(), date: today(), workoutDayId: day.id, planned: true, completed: true, readiness: c.recovery.readiness, durationMin: session?.estimatedMinutes });
    setDraft(null);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4 rise">
        <div>
          <div className="label">Entraînement</div>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1">{session ? session.title : 'Jour de repos'}</h1>
          <p className="text-ink-2 mt-1 max-w-2xl">{session ? session.message : 'Aucune séance planifiée aujourd’hui. Marche, mobilité, et un bon dîner : le muscle se construit entre les séances.'}</p>
        </div>
        <Segmented value={tab} onChange={setTab} options={[{ value: 'today', label: 'Aujourd’hui' }, { value: 'program', label: 'Programme' }, { value: 'history', label: 'Historique' }]} />
      </header>

      {tab === 'today' && (
        <>
          {c.deload.recommended && <div className="card-2 border-l-4 border-l-[var(--accent-recovery)] px-4 py-3 text-sm">Semaine allégée recommandée : {c.deload.reasons.join(' ')} <EvidenceBadge id="deload" className="ml-2" /></div>}
          {todaySession?.completed && <div className="card-2 border-l-4 border-l-[var(--accent-vitality)] px-4 py-3 text-sm flex items-center gap-2"><Check size={16} /> Séance du jour enregistrée. Les prochaines cibles sont déjà recalculées.</div>}
          {session && !session.replacedByRecovery ? (
            <div className="space-y-3 rise rise-1">
              {session.exercises.map((ex, i) => {
                const t = c.targetsByExercise[ex.exerciseId];
                const subId = subs[ex.exerciseId];
                const sets = logs[ex.exerciseId] ?? Array.from({ length: ex.sets }, () => ({ weightKg: t?.weightKg ?? 0, reps: 0, rir: ex.rirTarget }));
                const setSets = (arr: SetLog[]) => setLogs({ ...logs, [ex.exerciseId]: arr });
                return (
                  <Card key={ex.exerciseId} accent="muscle" kicker={`Exercice ${i + 1}`} title={subId ? substitutesFor(ex.exerciseId, p.equipment, p.level, p.limitations.map((l) => l.region)).find((s) => s.id === subId)?.name : ex.name} right={<button className="btn btn-ghost btn-sm" onClick={() => setSubOpen(ex.exerciseId)}><Replace size={14} /> Remplacer</button>}>
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="chip pointer-events-none">{ex.sets} × {ex.repMin}–{ex.repMax} {ex.note === 'En secondes' ? 's' : 'reps'}</span>
                      <span className="chip pointer-events-none">RIR {ex.rirTarget}</span>
                      <span className="chip pointer-events-none">Repos {ex.restSec} s</span>
                      {ex.note && ex.note !== 'En secondes' && <span className="chip pointer-events-none">{ex.note}</span>}
                    </div>
                    {t && (
                      <div className="card-2 p-3 text-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div><span className="font-semibold">{t.weightKg !== null ? `${t.weightKg} kg` : 'Charge à trouver'} · </span>{t.message}</div>
                          <WhyButton compact evidenceId={t.action === 'deload' ? 'deload' : 'double_progression'} explanation={{ logic: 'Double progression : fourchette de répétitions fixe. Quand toutes les séries atteignent le haut de la fourchette avec au moins 2 reps en réserve, on augmente la charge et on repart du bas de la fourchette.', expectedBenefit: 'Surcharge progressive régulière, sans stagnation ni sauts de charge excessifs.' }} />
                        </div>
                        {t.lastSession && <div className="text-xs text-ink-3 mt-1">Dernière fois ({t.lastSession.date}) : {t.lastSession.summary} · e1RM ≈ {t.lastSession.e1rm} kg</div>}
                      </div>
                    )}
                    <div className="grid grid-cols-[32px_1fr_1fr_1fr] gap-2 items-center text-sm">
                      <div className="label">Série</div><div className="label">Charge (kg)</div><div className="label">Reps</div><div className="label">RIR</div>
                      {sets.map((s, k) => (
                        <div key={k} className="contents">
                          <div className="tnum text-ink-2">{k + 1}</div>
                          <input className="input h-10" type="number" step="0.5" value={s.weightKg || ''} placeholder="kg" onChange={(e) => setSets(sets.map((x, j) => (j === k ? { ...x, weightKg: Number(e.target.value) } : x)))} />
                          <input className="input h-10" type="number" value={s.reps || ''} placeholder={`${ex.repMin}–${ex.repMax}`} onChange={(e) => setSets(sets.map((x, j) => (j === k ? { ...x, reps: Number(e.target.value) } : x)))} />
                          <input className="input h-10" type="number" value={s.rir ?? ''} onChange={(e) => setSets(sets.map((x, j) => (j === k ? { ...x, rir: Number(e.target.value) } : x)))} />
                        </div>
                      ))}
                    </div>
                  </Card>
                );
              })}
              <div className="flex items-center justify-between gap-3 card p-4">
                <div className="text-sm text-ink-2">Logue ce que tu as fait, même partiellement. Le moteur recalcule tes cibles pour la prochaine fois.</div>
                <button className="btn btn-primary" onClick={finish}><Check size={16} /> Terminer la séance</button>
              </div>
            </div>
          ) : session?.replacedByRecovery ? (
            <Card accent="recovery" title="Récupération active" kicker="Aujourd’hui">
              <p className="text-sm">{session.message}</p>
              {session.stopAdvice && <p className="text-sm text-ink-2">{session.stopAdvice}</p>}
              <EvidenceBadge id="readiness_autoregulation" />
            </Card>
          ) : (
            <Card title="Récupération" kicker="Repos">
              <p className="text-sm text-ink-2">Marche 20–30 min, mobilité 10 min. Prochaine séance : {c.program.days.find((d) => d.weekday > new Date().getDay())?.name ?? c.program.days[0]?.name}.</p>
            </Card>
          )}
        </>
      )}

      {tab === 'program' && (
        <div className="space-y-4 rise">
          <Card title={c.program.split} kicker="Ton programme" accent="muscle">
            <p className="text-sm text-ink-2">{c.program.rationale}</p>
            <div className="flex flex-wrap gap-2"><EvidenceBadge id="volume_hypertrophy" /><EvidenceBadge id="progressive_overload" /><span className="chip pointer-events-none">≈ {c.program.weeklySetsPerMuscleApprox} séries / muscle / semaine</span></div>
            {c.program.honestNotes.map((n) => <p key={n} className="text-sm card-2 p-3">{n}</p>)}
          </Card>
          <div className="grid md:grid-cols-3 gap-4">
            {c.program.days.map((d: WorkoutDay) => (
              <Card key={d.id} title={d.name} kicker={['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'][d.weekday]} right={<span className="text-xs text-ink-3">{d.estimatedMinutes} min</span>}>
                <div className="text-xs text-ink-3 -mt-2">{d.focus}</div>
                <ul className="text-sm space-y-1.5">{d.exercises.map((e) => <li key={e.exerciseId} className="flex justify-between gap-3"><span>{e.name}</span><span className="tnum text-ink-2 shrink-0">{e.sets}×{e.repMin}–{e.repMax}</span></li>)}</ul>
              </Card>
            ))}
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div className="space-y-3 rise">
          {[...state.performance].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 40).map((l) => (
            <div key={l.date + l.exerciseId} className="card-2 px-4 py-3 text-sm flex items-center justify-between gap-3">
              <div><span className="text-ink-3 tnum mr-3">{l.date}</span><span className="font-medium">{EXERCISE_BY_ID[l.exerciseId]?.name ?? l.exerciseId}</span></div>
              <div className="tnum text-ink-2">{l.sets.map((s) => `${s.weightKg}×${s.reps}`).join(' · ')}</div>
            </div>
          ))}
          {state.performance.length === 0 && <p className="text-sm text-ink-3">Aucune performance enregistrée pour l’instant.</p>}
        </div>
      )}

      <Sheet open={Boolean(subOpen)} onClose={() => setSubOpen(null)} title="Remplacer l’exercice">
        <div className="space-y-2">
          {subOpen && substitutesFor(subOpen, p.equipment, p.level, p.limitations.map((l) => l.region)).map((s) => (
            <button key={s.id} className="card-2 w-full text-left p-3 hover:bg-line transition-colors" onClick={() => { setSubs({ ...subs, [subOpen]: s.id }); setSubOpen(null); }}>
              <div className="font-medium">{s.name}</div><div className="text-xs text-ink-2">{s.cues}</div>
            </button>
          ))}
          {subOpen && substitutesFor(subOpen, p.equipment, p.level, p.limitations.map((l) => l.region)).length === 0 && <p className="text-sm text-ink-3">Pas d’alternative avec ton matériel pour ce mouvement.</p>}
        </div>
      </Sheet>
    </div>
  );
}
