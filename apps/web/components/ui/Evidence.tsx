'use client';
import { useState } from 'react';
import { EVIDENCE, EVIDENCE_LABEL, type EvidenceId, type EvidenceLevel, type Explanation } from '@recomp/engine';
import { HelpCircle, X } from 'lucide-react';
import { cx } from '@/lib/format';

const LEVEL_STYLE: Record<EvidenceLevel, string> = {
  solid: 'bg-[color-mix(in_srgb,var(--accent-vitality)_18%,transparent)] text-[color-mix(in_srgb,var(--accent-vitality)_70%,var(--ink))]',
  probable: 'bg-[color-mix(in_srgb,var(--accent-body)_16%,transparent)] text-[color-mix(in_srgb,var(--accent-body)_70%,var(--ink))]',
  uncertain: 'bg-[color-mix(in_srgb,var(--accent-recovery)_20%,transparent)] text-[color-mix(in_srgb,var(--accent-recovery)_60%,var(--ink))]',
  approach: 'bg-surface-2 text-ink-2',
};

export function EvidenceBadge({ id, level, className }: { id?: EvidenceId; level?: EvidenceLevel; className?: string }) {
  const lv = level ?? (id ? EVIDENCE[id].level : 'probable');
  const title = id ? EVIDENCE[id].title : undefined;
  return (
    <span title={title} className={cx('inline-flex items-center h-6 px-2 rounded-full text-[11px] font-semibold tracking-wide', LEVEL_STYLE[lv], className)}>
      Preuve : {EVIDENCE_LABEL[lv].toLowerCase()}
    </span>
  );
}

/** WHY ENGINE — bouton « Pourquoi ? » qui ouvre l'explication + la fiche de preuve. */
export function WhyButton({ explanation, evidenceId, label = 'Pourquoi ?', compact }: { explanation?: Explanation | { context?: string; logic: string; expectedBenefit?: string }; evidenceId?: EvidenceId; label?: string; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const eid = evidenceId ?? (explanation && 'evidenceId' in explanation ? explanation.evidenceId : undefined);
  const ev = eid ? EVIDENCE[eid] : null;
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={cx('inline-flex items-center gap-1.5 text-ink-2 hover:text-ink transition-colors', compact ? 'text-xs' : 'text-sm font-medium')}>
        <HelpCircle size={compact ? 14 : 16} /> {label}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-6 bg-black/30" onClick={() => setOpen(false)}>
          <div className="card w-full md:max-w-lg max-h-[85vh] overflow-auto p-6 rounded-b-none md:rounded-b-[var(--radius-card)] rise" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4 mb-4">
              <h3 className="font-bold text-lg">{label.replace(/\?$/, '')} — explication</h3>
              <button className="btn btn-ghost btn-sm -mr-2" onClick={() => setOpen(false)} aria-label="Fermer"><X size={18} /></button>
            </div>
            {explanation && (
              <div className="space-y-3 text-[15px]">
                {'context' in explanation && explanation.context && <p><span className="label block mb-1">Contexte</span>{explanation.context}</p>}
                <p><span className="label block mb-1">Logique</span>{explanation.logic}</p>
                {explanation.expectedBenefit && <p><span className="label block mb-1">Bénéfice attendu</span>{explanation.expectedBenefit}</p>}
              </div>
            )}
            {ev && (
              <div className="mt-5 card-2 p-4 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold">{ev.title}</div>
                  <EvidenceBadge level={ev.level} />
                </div>
                <p className="text-sm text-ink-2">{ev.summary}</p>
                <p className="text-sm"><span className="font-semibold">Ce que nous faisons : </span>{ev.whatWeDo}</p>
                <ul className="text-xs text-ink-3 list-disc pl-4">
                  {ev.sources.map((s) => <li key={s.ref}>{s.ref} ({s.year}, {s.type})</li>)}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
