'use client';
import { useState } from 'react';

export function BeforeAfterSlider({ before, after, labels }: { before: string; after: string; labels?: [string, string] }) {
  const [pos, setPos] = useState(50);
  return (
    <div className="relative select-none">
      <div className="relative aspect-[3/4] max-h-[520px] w-full overflow-hidden rounded-[var(--radius-ctl)] bg-surface-2">
        <img src={after} alt="Après" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 overflow-hidden" style={{ width: `${pos}%` }}>
          <img src={before} alt="Avant" className="absolute inset-0 h-full object-cover" style={{ width: `${10000 / pos}%`, maxWidth: 'none' }} />
        </div>
        <div className="absolute top-0 bottom-0 w-0.5 bg-white/90 shadow" style={{ left: `${pos}%` }} />
        {labels && (
          <>
            <span className="absolute top-3 left-3 glass rounded-full px-2.5 py-1 text-xs font-semibold">{labels[0]}</span>
            <span className="absolute top-3 right-3 glass rounded-full px-2.5 py-1 text-xs font-semibold">{labels[1]}</span>
          </>
        )}
      </div>
      <input type="range" min={2} max={98} value={pos} onChange={(e) => setPos(Number(e.target.value))} className="mt-3" aria-label="Comparer avant / après" />
    </div>
  );
}
