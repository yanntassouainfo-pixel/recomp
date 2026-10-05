'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarPlus, Download, Trash2 } from 'lucide-react';
import { EVIDENCE, type AppMode, type LifeEvent, type LifeEventType, type NutritionPrecision } from '@recomp/engine';
import { Card } from '@/components/ui/Card';
import { Segmented, Sheet } from '@/components/ui/Primitives';
import { EvidenceBadge } from '@/components/ui/Evidence';
import { useComputed } from '@/lib/useComputed';
import { today, useStore } from '@/lib/store';
import { fmtDate } from '@/lib/format';

const EVENTS: { v: LifeEventType; l: string; d: string }[] = [
  { v: 'restaurant', l: 'Restaurant ce soir', d: 'Profite ; protéines d’abord ; aucune compensation.' },
  { v: 'travel', l: 'Voyage', d: 'Ancre protéines, séances hôtel, marche.' },
  { v: 'busy_week', l: 'Semaine très chargée', d: 'Minimum efficace : 2 × 30 min, repas simples.' },
  { v: 'birthday', l: 'Anniversaire', d: 'Repas libre planifié.' },
  { v: 'ramadan', l: 'Ramadan', d: 'Plan recomposé autour du jeûne.' },
  { v: 'holiday', l: 'Vacances', d: 'Maintenance détendue, mouvement plaisir.' },
  { v: 'no_gym', l: 'Pas de salle cette semaine', d: 'Programme maison équivalent.' },
  { v: 'illness', l: 'Maladie', d: 'Repos, maintenance, hydratation.' },
];

export default function Profile() {
  const router = useRouter();
  const { state, computed: c } = useComputed();
  const updateProfile = useStore((s) => s.updateProfile);
  const addLifeEvent = useStore((s) => s.addLifeEvent);
  const removeLifeEvent = useStore((s) => s.removeLifeEvent);
  const addDecision = useStore((s) => s.addDecision);
  const reset = useStore((s) => s.reset);
  const [open, setOpen] = useState(false);
  const [ev, setEv] = useState<{ type: LifeEventType; days: number }>({ type: 'restaurant', days: 1 });
  const [confirm, setConfirm] = useState(false);
  if (!state || !c) return null;
  const p = state.profile;

  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `recomp-export-${today()}.json`; a.click();
  };
  const addEvent = () => {
    const end = new Date(today() + 'T00:00:00'); end.setDate(end.getDate() + ev.days - 1);
    const e: LifeEvent = { id: 'ev_' + Math.random().toString(36).slice(2, 8), type: ev.type, startDate: today(), endDate: end.toISOString().slice(0, 10) };
    addLifeEvent(e);
    addDecision({ date: today(), summary: `Life Mode : ${EVENTS.find((x) => x.v === ev.type)?.l} (${ev.days} j). Plan recomposé.`, why: 'La vie passe avant le plan ; on maintient, on reprend ensuite.', evidenceId: 'flex_meal_adherence' });
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <header className="rise">
        <div className="label">Profil</div>
        <h1 className="text-3xl font-extrabold tracking-tight mt-1">{p.displayName ?? 'Toi'} · {p.heightCm} cm · {p.startWeightKg} kg au départ</h1>
        <p className="text-ink-2 mt-1">{p.priorityStatement ?? 'Objectif : ' + p.primaryGoal}</p>
      </header>

      <section className="grid md:grid-cols-2 gap-4 rise rise-1">
        <Card kicker="Life Mode" title="Le plan s’adapte à ta vie" accent="consistency" right={<button className="btn btn-primary btn-sm" onClick={() => setOpen(true)}><CalendarPlus size={14} /> Déclarer</button>}>
          {c.lifePlan ? (
            <div className="card-2 p-4 text-sm space-y-2">
              <div className="font-semibold">{c.lifePlan.title} <span className="text-ink-3 font-normal">· reprise du plan normal le {fmtDate(c.lifePlan.resumesOn)}</span></div>
              <p>{c.lifePlan.message}</p>
              <div><span className="label">Nutrition</span><ul className="list-disc pl-4 text-ink-2">{c.lifePlan.nutrition.map((x) => <li key={x}>{x}</li>)}</ul></div>
              <div><span className="label">Entraînement</span><ul className="list-disc pl-4 text-ink-2">{c.lifePlan.training.map((x) => <li key={x}>{x}</li>)}</ul></div>
              <EvidenceBadge id={c.lifePlan.evidenceId} />
            </div>
          ) : (
            <p className="text-sm text-ink-2">Restaurant, voyage, semaine chargée, Ramadan, vacances, pas de salle, maladie : déclare-le et le coach recompose le plan autour, au lieu d’exiger que ta vie s’adapte.</p>
          )}
          {state.lifeEvents.length > 0 && (
            <ul className="text-sm space-y-1">{state.lifeEvents.map((e) => <li key={e.id} className="flex items-center justify-between gap-3"><span>{EVENTS.find((x) => x.v === e.type)?.l} · {fmtDate(e.startDate)} → {fmtDate(e.endDate)}</span><button className="btn btn-ghost btn-sm" onClick={() => removeLifeEvent(e.id)}><Trash2 size={14} /></button></li>)}</ul>
          )}
        </Card>
        <Card kicker="Modes" title="Profondeur du suivi, pas charge imposée">
          <div><span className="label">Mode</span><Segmented className="mt-1" value={p.mode} onChange={(v: AppMode) => updateProfile({ mode: v })} options={[{ value: 'simple', label: 'Simple' }, { value: 'busy', label: 'Busy' }, { value: 'performance', label: 'Performance' }]} /></div>
          <p className="text-xs text-ink-2">{p.mode === 'simple' ? 'Pas de jargon, pas de macros obligatoires : aujourd’hui, mange ceci, fais ceci, dors ceci.' : p.mode === 'busy' ? 'Minimum efficace : séances courtes, repas simples, pas de pesée des aliments.' : 'Suivi détaillé : charges, RIR, macros, périodisation, récupération.'}</p>
          <div><span className="label">Nutrition</span><Segmented className="mt-1" value={p.nutritionPrecision} onChange={(v: NutritionPrecision) => updateProfile({ nutritionPrecision: v })} options={[{ value: 'simple', label: 'Portions' }, { value: 'precise', label: 'Grammes' }]} /></div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <label className="block"><span className="label">Séances / semaine</span><input className="input mt-1" type="number" min={2} max={6} value={p.sessionsPerWeek} onChange={(e) => updateProfile({ sessionsPerWeek: Number(e.target.value) })} /></label>
            <label className="block"><span className="label">Durée (min)</span><input className="input mt-1" type="number" min={20} max={120} step={5} value={p.sessionMinutes} onChange={(e) => updateProfile({ sessionMinutes: Number(e.target.value) })} /></label>
            <label className="block"><span className="label">Repas / jour</span><select className="input mt-1" value={p.mealsPerDay} onChange={(e) => updateProfile({ mealsPerDay: Number(e.target.value) as 3 | 4 | 5 })}><option value={3}>3</option><option value={4}>4</option><option value={5}>5</option></select></label>
            <label className="block"><span className="label">Séance</span><select className="input mt-1" value={p.trainingTimeOfDay} onChange={(e) => updateProfile({ trainingTimeOfDay: e.target.value as typeof p.trainingTimeOfDay })}><option value="morning">Matin</option><option value="midday">Midi</option><option value="evening">Soir</option></select></label>
          </div>
        </Card>
      </section>

      <section className="grid md:grid-cols-2 gap-4 rise rise-2">
        <Card kicker="Evidence layer" title="Sur quoi repose le moteur">
          <ul className="space-y-2 text-sm max-h-80 overflow-auto pr-1">
            {Object.values(EVIDENCE).map((e) => (
              <li key={e.id} className="flex items-start justify-between gap-3 border-b border-line pb-2 last:border-0"><div><div className="font-medium">{e.title}</div><div className="text-xs text-ink-2">{e.whatWeDo}</div></div><EvidenceBadge level={e.level} className="shrink-0" /></li>
            ))}
          </ul>
        </Card>
        <Card kicker="Données & confidentialité" title="Tes données t’appartiennent">
          <ul className="text-sm text-ink-2 space-y-1.5 list-disc pl-4">
            <li>Mode démo : tout est stocké dans ce navigateur, rien n’est envoyé (sauf la question au coach si une clé IA est configurée côté serveur).</li>
            <li>Avec un compte : authentification Supabase, isolation par ligne (RLS), photos dans un espace privé chiffré, URL signées.</li>
            <li>Consentements séparés et révocables : analyse IA des photos ({p.consents.photoAiAnalysis ? 'accordé' : 'non accordé'}), amélioration produit ({p.consents.productImprovement ? 'accordé' : 'non accordé'}).</li>
            <li>Aucune photo ni donnée personnelle n’entraîne un modèle sans consentement explicite.</li>
          </ul>
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-secondary btn-sm" onClick={exportData}><Download size={14} /> Exporter (JSON)</button>
            <button className="btn btn-ghost btn-sm text-[var(--danger)]" onClick={() => setConfirm(true)}><Trash2 size={14} /> Supprimer toutes mes données</button>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <label className="flex items-center gap-2"><input type="checkbox" checked={p.consents.photoAiAnalysis} onChange={(e) => updateProfile({ consents: { ...p.consents, photoAiAnalysis: e.target.checked } })} /> Analyse IA des photos</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={p.consents.productImprovement} onChange={(e) => updateProfile({ consents: { ...p.consents, productImprovement: e.target.checked } })} /> Amélioration produit</label>
          </div>
        </Card>
      </section>

      <Sheet open={open} onClose={() => setOpen(false)} title="Déclarer un événement de vie">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">{EVENTS.map((e) => <button key={e.v} className="card-2 text-left p-3 hover:bg-line transition-colors" data-on={ev.type === e.v} style={ev.type === e.v ? { outline: '2px solid var(--ink)' } : {}} onClick={() => setEv({ ...ev, type: e.v, days: e.v === 'ramadan' ? 30 : e.v === 'travel' ? 4 : ['busy_week', 'no_gym', 'holiday'].includes(e.v) ? 7 : 1 })}><div className="font-medium text-sm">{e.l}</div><div className="text-xs text-ink-2">{e.d}</div></button>)}</div>
          <label className="block text-sm"><span className="label">Durée (jours)</span><input className="input mt-1" type="number" min={1} max={60} value={ev.days} onChange={(e) => setEv({ ...ev, days: Number(e.target.value) })} /></label>
          <button className="btn btn-primary w-full" onClick={addEvent}>Recomposer mon plan</button>
        </div>
      </Sheet>

      <Sheet open={confirm} onClose={() => setConfirm(false)} title="Supprimer toutes les données ?">
        <p className="text-sm text-ink-2 mb-4">Profil, mesures, photos, historique, conversations : tout sera effacé de ce navigateur. Irréversible. Pense à exporter avant.</p>
        <div className="flex gap-2"><button className="btn btn-secondary flex-1" onClick={() => setConfirm(false)}>Annuler</button><button className="btn btn-primary flex-1" style={{ background: 'var(--danger)' }} onClick={() => { reset(); router.replace('/'); }}>Tout supprimer</button></div>
      </Sheet>
    </div>
  );
}
