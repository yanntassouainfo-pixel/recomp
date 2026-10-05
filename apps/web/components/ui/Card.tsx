import { cx } from '@/lib/format';
import type { ReactNode } from 'react';

export type Accent = 'body' | 'muscle' | 'fat' | 'vitality' | 'recovery' | 'consistency' | 'nutrition' | 'none';

const ACCENT: Record<Accent, string> = {
  body: 'var(--accent-body)', muscle: 'var(--accent-muscle)', fat: 'var(--accent-fat)', vitality: 'var(--accent-vitality)',
  recovery: 'var(--accent-recovery)', consistency: 'var(--accent-consistency)', nutrition: 'var(--accent-nutrition)', none: 'transparent',
};

export function accentColor(a: Accent) { return ACCENT[a]; }

export function Card({ title, kicker, accent = 'none', right, children, className, emphasized, style }: { title?: ReactNode; kicker?: string; accent?: Accent; right?: ReactNode; children?: ReactNode; className?: string; emphasized?: boolean; style?: React.CSSProperties }) {
  return (
    <section data-accent={accent !== 'none' ? accent : undefined} data-emphasized={emphasized ? 'true' : undefined} className={cx('card p-5 md:p-6 flex flex-col gap-4 relative overflow-hidden', className)} style={{ ...(accent !== 'none' ? ({ '--card-accent': ACCENT[accent] } as React.CSSProperties) : {}), ...style }}>
      {(title || kicker || right) && (
        <header className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {accent !== 'none' && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: ACCENT[accent] }} />}
            <div className="min-w-0">
              {kicker && <div className="label">{kicker}</div>}
              {title && <h3 className="font-semibold text-[15px] leading-tight">{title}</h3>}
            </div>
          </div>
          {right && <div className="shrink-0">{right}</div>}
        </header>
      )}
      {children}
    </section>
  );
}

export function Stat({ value, unit, label, sub, size = 'lg' }: { value: ReactNode; unit?: string; label?: string; sub?: ReactNode; size?: 'md' | 'lg' | 'xl' }) {
  const cls = size === 'xl' ? 'text-5xl md:text-6xl' : size === 'lg' ? 'text-3xl md:text-4xl' : 'text-2xl';
  return (
    <div>
      {label && <div className="label mb-1">{label}</div>}
      <div className={cx('font-bold tracking-tight tnum leading-none', cls)}>
        {value}
        {unit && <span className="text-base font-medium text-ink-2 ml-1">{unit}</span>}
      </div>
      {sub && <div className="text-sm text-ink-2 mt-1.5">{sub}</div>}
    </div>
  );
}
