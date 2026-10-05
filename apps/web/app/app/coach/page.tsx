'use client';
import { useEffect, useRef, useState } from 'react';
import { Send, Trash2 } from 'lucide-react';
import { rulesCoach, type EvidenceId } from '@recomp/engine';
import { EvidenceBadge } from '@/components/ui/Evidence';
import { useComputed } from '@/lib/useComputed';
import { today, useStore } from '@/lib/store';
import { cx } from '@/lib/format';

const SUGGESTIONS = ['Je mange quoi ce soir ?', 'J’ai raté ma séance, je fais quoi ?', 'Je suis invité au restaurant', 'J’ai très faim aujourd’hui', 'Je pars en voyage pendant 5 jours', 'Je n’ai pas de poulet', 'Je peux manger du riz ?', 'Je suis fatigué, je m’entraîne quand même ?', 'Mon poids ne bouge plus depuis 3 semaines', 'Pourquoi plus de glucides aujourd’hui ?', 'Où j’en suis ?', 'Le jeûne intermittent, c’est pour moi ?'];

export default function Coach() {
  const { state, computed: c } = useComputed();
  const chat = useStore((s) => s.chat);
  const pushChat = useStore((s) => s.pushChat);
  const clearChat = useStore((s) => s.clearChat);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [source, setSource] = useState<string>('');
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chat.length]);
  if (!state || !c) return null;

  const ask = async (question: string) => {
    if (!question.trim() || busy) return;
    setQ('');
    pushChat({ role: 'user', content: question });
    setBusy(true);
    try {
      const res = await fetch('/api/coach', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ question, state, today: today(), history: chat.slice(-8).map((m) => ({ role: m.role, content: m.content })) }) });
      if (!res.ok) throw new Error('api');
      const a = (await res.json()) as { text: string; source: string; evidenceIds: string[]; providerId?: string };
      pushChat({ role: 'assistant', content: a.text, meta: { source: a.source === 'llm' ? `IA (${a.providerId})` : 'moteur', evidenceIds: a.evidenceIds } });
      setSource(a.source === 'llm' ? `Réponses générées par ${a.providerId}, contraintes par le moteur.` : 'Aucune clé IA configurée : réponses du coach déterministe (moteur). Ajoute ANTHROPIC_API_KEY ou OPENAI_API_KEY pour la conversation libre.');
    } catch {
      const r = rulesCoach(question, state, c);
      pushChat({ role: 'assistant', content: r.text, meta: { source: 'moteur (hors-ligne)', evidenceIds: r.evidenceIds } });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-7.5rem)] md:h-[calc(100dvh-4rem)]">
      <header className="flex items-end justify-between gap-3 mb-4 rise">
        <div>
          <div className="label">Coach</div>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1">Que dois-je faire dans ma situation ?</h1>
          <p className="text-ink-2 mt-1 text-sm">Le coach connaît ton profil, tes 14 derniers jours, ton plan du jour et tes décisions passées. Tu n’as pas à te répéter.</p>
        </div>
        {chat.length > 0 && <button className="btn btn-ghost btn-sm" onClick={clearChat}><Trash2 size={14} /> Effacer</button>}
      </header>

      <div className="flex-1 overflow-auto space-y-3 pr-1">
        {chat.length === 0 && (
          <div className="card p-5 rise rise-1">
            <div className="font-semibold mb-1">Mémoire du coach</div>
            <p className="text-sm text-ink-2">{c.bcs.headline} Aujourd’hui : {c.brief.dayType === 'training' ? `séance ${c.session?.title ?? ''}` : 'repos'}, {state.profile.nutritionPrecision === 'simple' ? `${c.nutrition.simple.proteinPalms} paumes de protéines` : `${c.nutrition.proteinG} g de protéines`}. Dernière décision : « {state.decisions[state.decisions.length - 1]?.summary} »</p>
            <div className="flex flex-wrap gap-2 mt-4">{SUGGESTIONS.map((s) => <button key={s} className="chip" onClick={() => ask(s)}>{s}</button>)}</div>
          </div>
        )}
        {chat.map((m, i) => (
          <div key={i} className={cx('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div className={cx('max-w-[85%] md:max-w-[70%] rounded-[20px] px-4 py-3 text-[15px] leading-relaxed rise', m.role === 'user' ? 'bg-ink text-bg rounded-br-md' : 'card rounded-bl-md')}>
              <div className="whitespace-pre-wrap">{m.content}</div>
              {m.meta && (
                <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                  {[...new Set(m.meta.evidenceIds)].slice(0, 2).map((id) => <EvidenceBadge key={id} id={id as EvidenceId} />)}
                  <span className="text-[11px] text-ink-3 ml-auto">{m.meta.source}</span>
                </div>
              )}
            </div>
          </div>
        ))}
        {busy && <div className="card inline-block rounded-[20px] px-4 py-3 text-sm text-ink-3">Le coach réfléchit…</div>}
        <div ref={endRef} />
      </div>

      <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); ask(q); }}>
        <input className="input flex-1" placeholder="Pose ta question…" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn btn-primary" disabled={busy || !q.trim()} aria-label="Envoyer"><Send size={16} /></button>
      </form>
      {source && <p className="text-[11px] text-ink-3 mt-2">{source}</p>}
      {chat.length > 0 && <div className="flex gap-2 overflow-x-auto mt-2 pb-1">{SUGGESTIONS.slice(0, 6).map((s) => <button key={s} className="chip shrink-0" onClick={() => ask(s)}>{s}</button>)}</div>}
    </div>
  );
}
