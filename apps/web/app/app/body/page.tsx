'use client';
import { useRef, useState } from 'react';
import { Camera, Plus } from 'lucide-react';
import type { BodyPhotoMeta, Measurement } from '@recomp/engine';
import { Card, Stat, accentColor } from '@/components/ui/Card';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { TrendChart } from '@/components/ui/Charts';
import { BeforeAfterSlider } from '@/components/ui/BeforeAfter';
import { Segmented, Sheet, TrendBadge } from '@/components/ui/Primitives';
import { EvidenceBadge } from '@/components/ui/Evidence';
import { useComputed } from '@/lib/useComputed';
import { today, useStore } from '@/lib/store';
import { fmtDate } from '@/lib/format';

export default function Body() {
  const { state, computed: c } = useComputed();
  const addMeasurement = useStore((s) => s.addMeasurement);
  const addPhoto = useStore((s) => s.addPhoto);
  const setPhotoAssessment = useStore((s) => s.setPhotoAssessment);
  const [open, setOpen] = useState(false);
  const [m, setM] = useState<Measurement>({ date: today(), protocolOk: true });
  const [view, setView] = useState<BodyPhotoMeta['view']>('front');
  const fileRef = useRef<HTMLInputElement>(null);
  if (!state || !c) return null;

  const photos = state.photos.filter((p) => p.uri && p.view === view).sort((a, b) => (a.date < b.date ? -1 : 1));
  const first = photos[0];
  const lastPhoto = photos[photos.length - 1];
  const last = (k: keyof Measurement) => [...state.measurements].reverse().find((x) => typeof x[k] === 'number')?.[k] as number | undefined;
  const firstV = (k: keyof Measurement) => state.measurements.find((x) => typeof x[k] === 'number')?.[k] as number | undefined;

  const onFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => addPhoto({ id: 'ph_' + Math.random().toString(36).slice(2, 8), date: today(), view, uri: String(reader.result) });
    reader.readAsDataURL(file);
  };

  const otherMeasures: [keyof Measurement, string][] = [['chestCm', 'Poitrine'], ['shouldersCm', 'Épaules'], ['hipsCm', 'Hanches'], ['armCm', 'Bras'], ['thighCm', 'Cuisse'], ['calfCm', 'Mollet'], ['neckCm', 'Cou']];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4 rise">
        <div>
          <div className="label">Transformation</div>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1">Est-ce que je progresse ?</h1>
          <p className="text-ink-2 mt-1 max-w-2xl">{c.bcs.headline}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> Ajouter des mesures</button>
      </header>

      <section className="grid md:grid-cols-[auto_1fr] gap-4 rise rise-1">
        <Card className="items-center text-center md:w-64">
          <ScoreRing value={c.bcs.score} size={150} stroke={12} color={accentColor('fat')} label="Body Composition" sub={c.bcs.trend === 'improving' ? 'en amélioration' : c.bcs.trend === 'stable' ? 'stable' : c.bcs.trend === 'worsening' ? 'en retrait' : 'données insuffisantes'} />
          <p className="text-xs text-ink-3">Score pédagogique, pas médical. Il combine taille, force, poids, régularité, sommeil, énergie et photos.</p>
        </Card>
        <Card kicker="Ce qui fait le score" title="Les signaux, pondérés">
          <ul className="space-y-2.5">
            {c.bcs.drivers.map((d) => (
              <li key={d.key} className="text-sm">
                <div className="flex items-center justify-between gap-3 mb-1"><span className="font-medium">{d.label} <span className="text-ink-3 font-normal">· {Math.round(d.weight * 100)} %</span></span><span className="tnum text-xs text-ink-2">{d.signal > 0.2 ? 'favorable' : d.signal < -0.2 ? 'défavorable' : 'neutre'}</span></div>
                <div className="h-1.5 rounded-full bg-surface-2 relative overflow-hidden"><div className="absolute top-0 bottom-0 left-1/2 w-px bg-line" /><div className="absolute top-0 bottom-0 rounded-full" style={{ left: d.signal >= 0 ? '50%' : `${50 + d.signal * 50}%`, width: `${Math.abs(d.signal) * 50}%`, background: d.signal >= 0 ? 'var(--accent-vitality)' : 'var(--accent-muscle)' }} /></div>
                <div className="text-xs text-ink-2 mt-1">{d.text}</div>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <section className="grid lg:grid-cols-2 gap-4 rise rise-2">
        <Card accent="fat" kicker="Signal principal" title="Tour de taille" right={<EvidenceBadge id="waist_marker" />}>
          <div className="flex items-end gap-4"><Stat value={last('waistCm') ?? '—'} unit="cm" />{firstV('waistCm') !== undefined && last('waistCm') !== undefined && <TrendBadge delta={last('waistCm')! - firstV('waistCm')!} unit=" cm" goodWhen="down" />}</div>
          <TrendChart smooth={c.series.waist} color={accentColor('fat')} unit="" height={200} />
          <p className="text-xs text-ink-3">Protocole : au niveau de l’ombilic, le matin à jeun, sans rentrer le ventre, ruban horizontal. Une fois par semaine.</p>
        </Card>
        <Card accent="body" kicker="Une donnée parmi d’autres" title="Poids" right={<EvidenceBadge id="weight_noise" />}>
          <div className="flex items-end gap-4"><Stat value={c.series.weightRolling.length ? c.series.weightRolling[c.series.weightRolling.length - 1]!.value.toFixed(1) : '—'} unit="kg" sub="moyenne 7 jours" />{c.series.weightRolling.length > 1 && <TrendBadge delta={c.series.weightRolling[c.series.weightRolling.length - 1]!.value - c.series.weightRolling[0]!.value} unit=" kg" goodWhen="neutral" />}</div>
          <TrendChart raw={c.series.weight} smooth={c.series.weightRolling} color={accentColor('body')} height={200} />
          <p className="text-xs text-ink-3">Les points gris sont les pesées ; la ligne, la tendance. Seule la ligne compte.</p>
        </Card>
        <Card accent="muscle" kicker="Muscle" title="Indice de force (mouvements clés)" right={<EvidenceBadge id="progressive_overload" />}>
          <div className="flex items-end gap-4"><Stat value={c.series.strength.length ? c.series.strength[c.series.strength.length - 1]!.value.toFixed(0) : '—'} unit="/ 100 au départ" />{c.series.strength.length > 1 && <TrendBadge delta={c.series.strength[c.series.strength.length - 1]!.value - 100} unit=" %" goodWhen="up" />}</div>
          <TrendChart smooth={c.series.strength} color={accentColor('muscle')} height={200} reference={100} />
          <p className="text-xs text-ink-3">Moyenne des e1RM estimés, normalisés à 100 au départ. Si l’indice monte, le muscle est au minimum préservé.</p>
        </Card>
        <Card kicker="Mensurations" title="Le reste du corps">
          <div className="grid grid-cols-2 gap-2">
            {otherMeasures.map(([k, l]) => {
              const v = last(k); const f = firstV(k);
              return <div key={k} className="card-2 p-3 flex items-center justify-between"><div><div className="text-xs text-ink-3">{l}</div><div className="font-bold tnum">{v !== undefined ? `${v} cm` : '—'}</div></div>{v !== undefined && f !== undefined && <TrendBadge delta={v - f} unit="" goodWhen={k === 'hipsCm' ? 'neutral' : 'up'} />}</div>;
            })}
          </div>
        </Card>
      </section>

      <section className="rise rise-3">
        <Card kicker="Suivi visuel" title="Photos : le moment où le corps parle" right={<Segmented value={view} onChange={setView} options={[{ value: 'front', label: 'Face' }, { value: 'side', label: 'Profil' }, { value: 'back', label: 'Dos' }]} />}>
          <div className="grid md:grid-cols-[1fr_320px] gap-5">
            <div>
              {first && lastPhoto && first.id !== lastPhoto.id ? (
                <BeforeAfterSlider before={first.uri} after={lastPhoto.uri} labels={[fmtDate(first.date), fmtDate(lastPhoto.date)]} />
              ) : (
                <div className="aspect-[3/4] max-h-[420px] card-2 grid place-items-center text-center p-6">
                  <div><Camera className="mx-auto mb-3 text-ink-3" /><div className="font-medium">{first ? 'Une seule photo pour l’instant' : 'Aucune photo'}</div><p className="text-sm text-ink-2 mt-1 max-w-xs">{first ? 'La comparaison apparaîtra avec la prochaine, dans 4 semaines.' : 'Facultatif, mais c’est souvent là que le « wow » arrive : « mon poids n’a presque pas changé… mais mon corps a changé ».'}</p></div>
                </div>
              )}
            </div>
            <div className="space-y-3">
              <div className="card-2 p-3 text-sm"><div className="font-semibold mb-1">Protocole</div><ul className="text-ink-2 space-y-0.5 list-disc pl-4"><li>Même lumière, même endroit</li><li>Même distance (repère au sol)</li><li>Même posture, bras le long du corps</li><li>Matin, avant de manger si possible</li><li>Toutes les 4 semaines</li></ul></div>
              <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ''; }} />
              <button className="btn btn-primary w-full" onClick={() => fileRef.current?.click()}><Camera size={16} /> Ajouter une photo ({view === 'front' ? 'face' : view === 'side' ? 'profil' : 'dos'})</button>
              {lastPhoto && (
                <div className="text-sm">
                  <div className="label mb-1.5">Par rapport à la précédente, tu te vois…</div>
                  <Segmented value={lastPhoto.selfAssessment ?? 'same'} onChange={(v) => setPhotoAssessment(lastPhoto.id, v as BodyPhotoMeta['selfAssessment'])} options={[{ value: 'worse', label: 'Moins bien' }, { value: 'same', label: 'Pareil' }, { value: 'better', label: 'Mieux' }]} />
                </div>
              )}
              <div className="text-xs text-ink-3 flex flex-col gap-1.5"><EvidenceBadge id="photo_bodyfat" /><span>Jamais de % de masse grasse déduit d’une photo. Les photos restent sur ton appareil en mode démo ; avec un compte, elles sont stockées chiffrées dans un espace privé.</span></div>
            </div>
          </div>
        </Card>
      </section>

      <Sheet open={open} onClose={() => setOpen(false)} title="Mesures du jour">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <label className="block col-span-2"><span className="label">Date</span><input className="input mt-1" type="date" value={m.date} onChange={(e) => setM({ ...m, date: e.target.value })} /></label>
          <label className="block"><span className="label">Poids (kg)</span><input className="input mt-1" type="number" step="0.1" value={m.weightKg ?? ''} onChange={(e) => setM({ ...m, weightKg: e.target.value ? Number(e.target.value) : undefined })} /></label>
          <label className="block"><span className="label">Tour de taille (cm)</span><input className="input mt-1" type="number" step="0.5" value={m.waistCm ?? ''} onChange={(e) => setM({ ...m, waistCm: e.target.value ? Number(e.target.value) : undefined })} /></label>
          {otherMeasures.map(([k, l]) => <label key={k} className="block"><span className="label">{l} (cm)</span><input className="input mt-1" type="number" step="0.5" value={(m[k] as number | undefined) ?? ''} onChange={(e) => setM({ ...m, [k]: e.target.value ? Number(e.target.value) : undefined })} /></label>)}
          <label className="col-span-2 flex items-center gap-3"><input type="checkbox" checked={m.protocolOk ?? true} onChange={(e) => setM({ ...m, protocolOk: e.target.checked })} /> Mesuré le matin, à jeun, après être passé aux toilettes</label>
          <button className="btn btn-primary col-span-2" onClick={() => { addMeasurement(m); setOpen(false); setM({ date: today(), protocolOk: true }); }}>Enregistrer</button>
        </div>
      </Sheet>
    </div>
  );
}
