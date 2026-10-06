'use client';
import type { Muscle, MovementPattern } from '@recomp/engine';

/* ---------- Carte des muscles (face + dos), silhouettes simplifiées ---------- */

type Region = { id: Muscle; view: 'front' | 'back'; shapes: string[] };

// Ellipses "cx,cy,rx,ry" sur un repère 120×260 (une vue)
const REGIONS: Region[] = [
  { id: 'chest', view: 'front', shapes: ['46,78,16,11', '74,78,16,11'] },
  { id: 'front_delts', view: 'front', shapes: ['27,68,8,9', '93,68,8,9'] },
  { id: 'side_delts', view: 'front', shapes: ['20,72,5,10', '100,72,5,10'] },
  { id: 'side_delts', view: 'back', shapes: ['20,72,5,10', '100,72,5,10'] },
  { id: 'biceps', view: 'front', shapes: ['22,98,6,15', '98,98,6,15'] },
  { id: 'forearms', view: 'front', shapes: ['17,132,5,17', '103,132,5,17'] },
  { id: 'forearms', view: 'back', shapes: ['17,132,5,17', '103,132,5,17'] },
  { id: 'core', view: 'front', shapes: ['60,112,14,24'] },
  { id: 'quads', view: 'front', shapes: ['46,180,11,32', '74,180,11,32'] },
  { id: 'calves', view: 'front', shapes: ['46,236,7,16', '74,236,7,16'] },
  { id: 'traps', view: 'back', shapes: ['60,62,22,8'] },
  { id: 'rear_delts', view: 'back', shapes: ['27,70,8,9', '93,70,8,9'] },
  { id: 'lats', view: 'back', shapes: ['44,100,10,22', '76,100,10,22'] },
  { id: 'back', view: 'back', shapes: ['60,92,10,20'] },
  { id: 'triceps', view: 'back', shapes: ['22,98,6,15', '98,98,6,15'] },
  { id: 'glutes', view: 'back', shapes: ['49,150,12,12', '71,150,12,12'] },
  { id: 'hamstrings', view: 'back', shapes: ['46,188,10,28', '74,188,10,28'] },
  { id: 'calves', view: 'back', shapes: ['46,238,7,16', '74,238,7,16'] },
];

function Silhouette() {
  // tête, tronc, bras, jambes — contour doux
  return (
    <g fill="none" stroke="var(--line)" strokeWidth="1.5">
      <circle cx="60" cy="24" r="13" />
      <path d="M44 42 h32 l10 10 v60 l-6 6 v10 h-6 v-10 l-4 40 l6 100 h-14 l-4 -96 h-4 l-4 96 h-14 l6 -100 l-4 -40 v10 h-6 v-10 l-6 -6 v-60 z" />
      <path d="M44 52 l-26 10 l-4 70 h8 l6 -56" />
      <path d="M76 52 l26 10 l4 70 h-8 l-6 -56" />
    </g>
  );
}

export function BodyMap({ muscles, size = 150 }: { muscles: Muscle[]; size?: number }) {
  const on = new Set(muscles);
  const primary = muscles[0];
  const view = (v: 'front' | 'back') => (
    <svg viewBox="0 0 120 260" width={size * (120 / 260)} height={size} aria-hidden>
      <Silhouette />
      {REGIONS.filter((r) => r.view === v).map((r) =>
        r.shapes.map((s, i) => {
          const [cx, cy, rx, ry] = s.split(',').map(Number);
          const active = on.has(r.id);
          return <ellipse key={r.id + i} cx={cx} cy={cy} rx={rx} ry={ry} fill={active ? (r.id === primary ? 'var(--accent-muscle)' : 'color-mix(in srgb, var(--accent-muscle) 45%, transparent)') : 'var(--surface-2)'} stroke={active ? 'var(--accent-muscle)' : 'var(--line)'} strokeWidth="1" />;
        }),
      )}
      <text x="60" y="258" textAnchor="middle" fontSize="9" fill="var(--ink-3)">{v === 'front' ? 'face' : 'dos'}</text>
    </svg>
  );
  return <div className="flex gap-2 items-end">{view('front')}{view('back')}</div>;
}

/* ---------- Pictogrammes de mouvement (figure en traits) ---------- */

const F = { stroke: 'currentColor', strokeWidth: 3, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
const Head = ({ x, y }: { x: number; y: number }) => <circle cx={x} cy={y} r={6} {...F} />;
const Bar = ({ x1, x2, y }: { x1: number; x2: number; y: number }) => <g {...F} strokeWidth={4}><line x1={x1} x2={x2} y1={y} y2={y} /><rect x={x1 - 4} y={y - 6} width={5} height={12} fill="currentColor" stroke="none" /><rect x={x2 - 1} y={y - 6} width={5} height={12} fill="currentColor" stroke="none" /></g>;

const PICTO: Record<MovementPattern, React.ReactNode> = {
  squat: <g><Head x={50} y={22} /><path d="M50 28 v22 M50 50 l-14 16 l6 18 M50 50 l14 16 l-6 18 M50 34 l-16 2 M50 34 l16 2" {...F} /><Bar x1={30} x2={70} y={33} /></g>,
  hinge: <g><Head x={38} y={30} /><path d="M44 34 l20 14 l0 20 l-8 20 M64 48 l8 20 l-6 18 M46 38 l-2 28 M52 42 l-2 24" {...F} /><Bar x1={34} x2={60} y={66} /></g>,
  lunge: <g><Head x={50} y={20} /><path d="M50 26 v24 M50 50 l-16 10 l-6 22 M50 50 l12 14 l10 18 M50 34 l-12 10 M50 34 l12 10" {...F} /><g fill="currentColor"><rect x={32} y={44} width={8} height={5} /><rect x={60} y={44} width={8} height={5} /></g></g>,
  horizontal_push: <g><path d="M20 62 h60" {...F} /><Head x={30} y={52} /><path d="M38 54 h34 l12 2 M56 52 v-16 M56 54 v-16" {...F} /><Bar x1={44} x2={68} y={36} /></g>,
  vertical_push: <g><Head x={50} y={30} /><path d="M50 36 v26 M50 62 l-8 20 M50 62 l8 20 M50 42 l-14 -10 l0 -12 M50 42 l14 -10 l0 -12" {...F} /><Bar x1={30} x2={70} y={18} /></g>,
  horizontal_pull: <g><Head x={32} y={26} /><path d="M38 30 l20 10 l8 24 M58 40 l4 24 M44 34 l0 20 l10 0 M52 38 l0 18" {...F} /><Bar x1={42} x2={68} y={58} /></g>,
  vertical_pull: <g><Bar x1={30} x2={70} y={16} /><Head x={50} y={34} /><path d="M50 40 v22 M50 62 l-6 20 M50 62 l6 20 M50 44 l-14 -8 l0 -18 M50 44 l14 -8 l0 -18" {...F} /></g>,
  core: <g><Head x={26} y={44} /><path d="M32 46 l44 -6 l14 10 M40 50 l-4 14 M76 40 l-2 20" {...F} /><path d="M18 70 h66" {...F} strokeWidth={2} /></g>,
  iso_shoulders: <g><Head x={50} y={28} /><path d="M50 34 v28 M50 62 l-8 20 M50 62 l8 20 M50 40 l-20 -2 M50 40 l20 -2" {...F} /><g fill="currentColor"><rect x={24} y={34} width={8} height={8} /><rect x={68} y={34} width={8} height={8} /></g></g>,
  iso_arms_biceps: <g><Head x={50} y={26} /><path d="M50 32 v30 M50 62 l-8 20 M50 62 l8 20 M50 40 l-12 4 l2 -18 M50 40 l12 4 l-2 -18" {...F} /><g fill="currentColor"><rect x={34} y={22} width={10} height={6} /><rect x={56} y={22} width={10} height={6} /></g></g>,
  iso_arms_triceps: <g><Head x={50} y={26} /><path d="M50 32 v30 M50 62 l-8 20 M50 62 l8 20 M50 40 l-10 -10 l10 -18 M50 40 l10 -10 l-10 -18" {...F} /><rect x={44} y={8} width={12} height={6} fill="currentColor" /></g>,
  iso_legs: <g><Head x={30} y={36} /><path d="M36 40 l28 2 l8 20 l18 -8 M62 44 l-4 20 M44 42 l-4 18" {...F} /><rect x={86} y={50} width={8} height={8} fill="currentColor" /></g>,
  iso_calves: <g><Head x={50} y={22} /><path d="M50 28 v30 M50 58 l-6 20 l-2 -6 M50 58 l6 20 l-2 -6 M50 36 l-10 6 M50 36 l10 6" {...F} /><path d="M30 84 h40" {...F} strokeWidth={2} /></g>,
  carry: <g><Head x={50} y={22} /><path d="M50 28 v30 M50 58 l-10 22 M50 58 l10 22 M50 34 l-14 2 l0 26 M50 34 l14 2 l0 26" {...F} /><g fill="currentColor"><rect x={30} y={60} width={12} height={8} /><rect x={58} y={60} width={12} height={8} /></g></g>,
};

export function Pictogram({ pattern, size = 72, className }: { pattern: MovementPattern; size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 100 90" width={size} height={size * 0.9} className={className} aria-hidden style={{ color: 'var(--accent-muscle)' }}>
      {PICTO[pattern]}
    </svg>
  );
}
