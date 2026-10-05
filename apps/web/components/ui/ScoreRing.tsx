'use client';
import { cx } from '@/lib/format';

export function ScoreRing({ value, max = 100, size = 120, stroke = 10, color = 'var(--accent-body)', label, sub, className }: { value: number; max?: number; size?: number; stroke?: number; color?: string; label?: string; sub?: string; className?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value / max));
  return (
    <div className={cx('relative inline-flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} style={{ transition: 'stroke-dashoffset 900ms var(--ease)' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <div className="font-bold tnum leading-none" style={{ fontSize: size * 0.26 }}>{Number.isInteger(value) ? value : value.toFixed(1)}</div>
        {label && <div className="text-[11px] text-ink-3 mt-1 font-medium uppercase tracking-wide">{label}</div>}
        {sub && <div className="text-[11px] text-ink-2">{sub}</div>}
      </div>
    </div>
  );
}
