'use client';
import { cx } from '@/lib/format';
import { ArrowDownRight, ArrowRight, ArrowUpRight, X } from 'lucide-react';
import type { ReactNode } from 'react';

export function TrendBadge({ delta, unit = '', goodWhen = 'down', decimals = 1, flatThreshold = 0.1 }: { delta: number; unit?: string; goodWhen?: 'down' | 'up' | 'neutral'; decimals?: number; flatThreshold?: number }) {
  const flat = Math.abs(delta) < flatThreshold;
  const good = goodWhen === 'neutral' ? null : goodWhen === 'down' ? delta < 0 : delta > 0;
  const color = flat || good === null ? 'text-ink-2 bg-surface-2' : good ? 'text-[var(--accent-vitality)] bg-[color-mix(in_srgb,var(--accent-vitality)_14%,transparent)]' : 'text-[var(--accent-muscle)] bg-[color-mix(in_srgb,var(--accent-muscle)_14%,transparent)]';
  const Icon = flat ? ArrowRight : delta > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={cx('inline-flex items-center gap-1 h-6 px-2 rounded-full text-xs font-semibold tnum', color)}>
      <Icon size={13} /> {flat ? 'stable' : `${delta > 0 ? '+' : ''}${delta.toFixed(decimals)}${unit}`}
    </span>
  );
}

export function Segmented<T extends string>({ value, onChange, options, className }: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode }[]; className?: string }) {
  return (
    <div className={cx('inline-flex p-1 rounded-[var(--radius-ctl)] bg-surface-2 gap-1', className)}>
      {options.map((o) => (
        <button key={o.value} type="button" onClick={() => onChange(o.value)} className={cx('h-9 px-3.5 rounded-[10px] text-sm font-medium transition-all', value === o.value ? 'bg-surface shadow-sm text-ink' : 'text-ink-2 hover:text-ink')}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function SliderField({ label, value, onChange, min = 1, max = 5, low, high, step = 1, format }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; low?: string; high?: string; step?: number; format?: (v: number) => string }) {
  return (
    <label className="block">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm tnum text-ink-2">{format ? format(value) : value}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      {(low || high) && (
        <div className="flex justify-between text-[11px] text-ink-3 mt-0.5"><span>{low}</span><span>{high}</span></div>
      )}
    </label>
  );
}

export function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return <button type="button" className="chip" data-on={on} onClick={onClick}>{children}</button>;
}

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children: ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/30 md:p-6" onClick={onClose}>
      <div className="card w-full md:max-w-xl max-h-[90vh] overflow-auto p-6 rounded-b-none md:rounded-b-[var(--radius-card)] rise" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 mb-4">
          {title && <h3 className="font-bold text-lg">{title}</h3>}
          <button className="btn btn-ghost btn-sm -mr-2" onClick={onClose} aria-label="Fermer"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Empty({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="text-center py-10 px-4">
      <div className="font-semibold mb-1">{title}</div>
      {text && <p className="text-sm text-ink-2 max-w-sm mx-auto">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Alerts({ alerts }: { alerts: { id: string; level: 'success' | 'info' | 'warning' | 'safety'; text: string }[] }) {
  if (!alerts.length) return null;
  const style: Record<string, string> = {
    success: 'border-l-[var(--accent-vitality)]',
    info: 'border-l-[var(--accent-body)]',
    warning: 'border-l-[var(--accent-recovery)]',
    safety: 'border-l-[var(--danger)]',
  };
  return (
    <div className="flex flex-col gap-2">
      {alerts.map((a) => (
        <div key={a.id} className={cx('card-2 border-l-4 px-4 py-3 text-sm', style[a.level])}>{a.text}</div>
      ))}
    </div>
  );
}
