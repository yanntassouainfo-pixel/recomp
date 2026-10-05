'use client';
import type { PlateProportions } from '@recomp/engine';

const COLORS = { protein: 'var(--accent-muscle)', veg: 'var(--accent-nutrition)', carbs: 'var(--accent-recovery)', fat: 'var(--accent-fat)' } as const;
const LABELS = { protein: 'Protéines', veg: 'Légumes / fibres', carbs: 'Glucides', fat: 'Bonnes graisses' } as const;

export function PlateDiagram({ plate, size = 200 }: { plate: PlateProportions; size?: number }) {
  const parts: (keyof typeof COLORS)[] = ['protein', 'veg', 'carbs', 'fat'];
  const r = size / 2 - 6;
  const cx0 = size / 2;
  const cy0 = size / 2;
  let angle = -Math.PI / 2;
  const slices = parts.map((k) => {
    const frac = plate[k];
    const a0 = angle;
    const a1 = angle + frac * 2 * Math.PI;
    angle = a1;
    const large = a1 - a0 > Math.PI ? 1 : 0;
    const x0 = cx0 + r * Math.cos(a0), y0 = cy0 + r * Math.sin(a0);
    const x1 = cx0 + r * Math.cos(a1), y1 = cy0 + r * Math.sin(a1);
    return { k, d: `M ${cx0} ${cy0} L ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} Z`, frac };
  });
  return (
    <div className="flex flex-col sm:flex-row items-center gap-5">
      <svg width={size} height={size} className="shrink-0">
        <circle cx={cx0} cy={cy0} r={size / 2 - 1} fill="var(--surface-2)" />
        {slices.map((s) => <path key={s.k} d={s.d} fill={COLORS[s.k]} stroke="var(--surface)" strokeWidth={3} />)}
        <circle cx={cx0} cy={cy0} r={r * 0.32} fill="var(--surface)" />
      </svg>
      <ul className="space-y-2 text-sm">
        <li className="label mb-1">{plate.label}</li>
        {parts.map((k) => (
          <li key={k} className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-sm" style={{ background: COLORS[k] }} />
            <span className="flex-1">{LABELS[k]}</span>
            <span className="tnum font-semibold">{Math.round(plate[k] * 100)} %</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
