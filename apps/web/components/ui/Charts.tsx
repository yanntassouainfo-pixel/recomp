'use client';
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine } from 'recharts';
import { fmtDate } from '@/lib/format';

type Pt = { date: string; value: number };

export function Sparkline({ data, color = 'var(--accent-body)', height = 48 }: { data: Pt[]; color?: string; height?: number }) {
  if (data.length < 2) return <div className="text-xs text-ink-3" style={{ height }}>Pas encore assez de points</div>;
  const id = 'g' + color.replace(/[^a-z0-9]/gi, '');
  return (
    <div style={{ height, width: '100%' }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.25} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis domain={['dataMin - 0.5', 'dataMax + 0.5']} hide />
          <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill={`url(#${id})`} isAnimationActive={false} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TrendChart({ raw, smooth, color = 'var(--accent-body)', unit = '', height = 220, reference }: { raw?: Pt[]; smooth: Pt[]; color?: string; unit?: string; height?: number; reference?: number }) {
  const map = new Map<string, { date: string; raw?: number; smooth?: number }>();
  for (const p of raw ?? []) map.set(p.date, { ...(map.get(p.date) ?? { date: p.date }), raw: p.value });
  for (const p of smooth) map.set(p.date, { ...(map.get(p.date) ?? { date: p.date }), smooth: p.value });
  const data = [...map.values()].sort((a, b) => (a.date < b.date ? -1 : 1));
  if (data.length < 2) return <div className="text-sm text-ink-3 py-8 text-center">Pas encore assez de données.</div>;
  return (
    <div style={{ height, width: '100%' }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <CartesianGrid stroke="var(--line)" vertical={false} />
          <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fill: 'var(--ink-3)', fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={32} />
          <YAxis domain={['dataMin - 0.5', 'dataMax + 0.5']} tick={{ fill: 'var(--ink-3)', fontSize: 11 }} axisLine={false} tickLine={false} width={48} tickFormatter={(v: number) => `${v}${unit}`} />
          <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, fontSize: 12 }} labelFormatter={(l) => fmtDate(String(l))} formatter={((v: unknown, name: unknown) => [`${typeof v === 'number' ? v.toFixed(1) : String(v)}${unit}`, name === 'smooth' ? 'Tendance 7 j' : 'Mesure']) as never} />
          {reference !== undefined && <ReferenceLine y={reference} stroke="var(--ink-3)" strokeDasharray="4 4" />}
          {raw && <Line type="monotone" dataKey="raw" stroke={color} strokeOpacity={0.25} strokeWidth={1} dot={{ r: 2, fill: color, opacity: 0.4, strokeWidth: 0 }} isAnimationActive={false} />}
          <Line type="monotone" dataKey="smooth" stroke={color} strokeWidth={2.5} dot={false} isAnimationActive={false} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
