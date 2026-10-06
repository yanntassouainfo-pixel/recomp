'use client';
import { useRef, useState } from 'react';
import { checkPhotoQuality, dataUrlToBase64, type LocalPhotoCheck } from '@/lib/photoQuality';
import { Sparkles, ShieldCheck } from 'lucide-react';
import { Camera, Plus } from 'lucide-react';
import { SITE_PHOTOS, type BodyPhotoMeta, type Measurement, type PhotoAnalysis } from '@recomp/engine';
import { PhotoFrame } from '@/components/ui/Photo';
import { Card, Stat, accentColor } from '@/components/ui/Card';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { TrendChart } from '@/components/ui/Charts';
import { BeforeAfterSlider } from '@/components/ui/BeforeAfter';
import { Segmented, Sheet, TrendBadge } from '@/components/ui/Primitives';
import { EvidenceBadge } from '@/components/ui/Evidence';
import { useComputed } from '@/lib/useComputed';
import { today, useStore } from '@/lib/store';
import { cx, fmtDate } from '@/lib/format';

export default function Body() {
  const { state, computed: c } = useComputed();
  const addMeasurement = useStore((s) => s.addMeasurement);
  const addPhoto = useStore((s) => s.addPhoto);
  const setPhotoAssessment = useStore((s) => s.setPhotoAssessment);
  const setPhotoAnalysis = useStore((s) => s.setPhotoAnalysis);
  const updateProfile = useStore((s) => s.updateProfile);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiMsg, setAiMsg] = useState<string | null>(null);
  const [localCheck, setLocalCheck] = useState<LocalPhotoCheck | null>(null);
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

  const [photoError, setPhotoError] = useState<string | null>(null);
  const onFile = async (file: File) => {
    setPhotoError(null);
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/heic'].includes(file.type)) return setPhotoError('Format non pris en charge : JPEG, PNG ou WebP.');
    if (file.size > 15 * 1024 * 1024) return setPhotoError('Photo trop lourde (max 15 Mo).');
    try {
      const uri = await compressImage(file, 1280, 0.82);
      try {
        addPhoto({ id: 'ph_' + Math.random().toString(36).slice(2, 8), date: today(), view, uri });
        // vérification du quota : zustand persist échoue silencieusement sinon
        localStorage.setItem('recomp-quota-probe', '1'); localStorage.removeItem('recomp-quota-probe');
      } catch {
        setPhotoError('Espace de stockage du navigateur plein : exporte tes données puis supprime d’anciennes photos.');
      }
    } catch {
      setPhotoError('Impossible de lire cette image.');
    }
  };

  const isStatic = process.env.NEXT_PUBLIC_STATIC === '1';
  const analyze = async () => {
    if (!lastPhoto) return;
    setAiMsg(null);
    if (!state.profile.consents.photoAiAnalysis) { setAiMsg('Active d’abord le consentement « Analyse IA des photos » ci-dessous : la photo est envoyée à un modèle de vision tiers, uniquement pour cette analyse, sans être conservée.'); return; }
    setAnalyzing(true);
    try {
      const lc = await checkPhotoQuality(lastPhoto.uri); setLocalCheck(lc);
      if (isStatic) { setAiMsg('Version de démonstration statique : l’analyse par IA tourne sur la version serveur (clé IA côté serveur). Le contrôle qualité ci-dessous, lui, est fait sur ton appareil.'); return; }
      const cur = dataUrlToBase64(lastPhoto.uri); if (!cur) { setAiMsg('Format de photo non pris en charge.'); return; }
      const prevPhoto = photos.length > 1 ? photos[photos.length - 2] : undefined;
      const prev = prevPhoto ? dataUrlToBase64(prevPhoto.uri) : null;
      const weeks = prevPhoto ? Math.round((Date.parse(lastPhoto.date) - Date.parse(prevPhoto.date)) / (7 * 86_400_000)) : null;
      const res = await fetch((process.env.NEXT_PUBLIC_BASE_PATH ?? '') + '/api/vision', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ consent: true, current: { ...cur, view: lastPhoto.view, date: lastPhoto.date }, previous: prev && prevPhoto ? { ...prev, view: prevPhoto.view, date: prevPhoto.date } : undefined, profile: { sex: state.profile.sex, age: state.profile.age, heightCm: state.profile.heightCm, primaryGoal: state.profile.primaryGoal, visualGoals: state.profile.visualGoals, fatStorage: state.profile.fatStorage }, context: { waistDeltaCm: c.review.metrics.waistDelta, weightDeltaKg: c.review.metrics.weightDelta, strengthDeltaPct: c.review.metrics.strengthDeltaPct, weeksBetween: weeks } }) });
      const r = (await res.json()) as { ok?: boolean; refused?: boolean; refusalReason?: string; analysis?: PhotoAnalysis; error?: string };
      if (r.ok && r.analysis) { setPhotoAnalysis(lastPhoto.id, r.analysis); setAiMsg(null); }
      else if (r.refused) setAiMsg(`Analyse refusée : ${r.refusalReason}`);
      else if (r.error === 'no_vision_provider') setAiMsg('Aucune clé IA avec vision n’est configurée sur ce serveur (ANTHROPIC_API_KEY ou OPENAI_API_KEY dans .env.local).');
      else setAiMsg('L’analyse a échoué. Réessaie dans un instant.');
    } catch { setAiMsg('Impossible de joindre le serveur d’analyse.'); }
    finally { setAnalyzing(false); }
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
        {c.weightGoal && (
          <Card accent="body" kicker="Objectif de poids" title={`${c.weightGoal.currentKg} → ${c.weightGoal.targetKg} kg`} right={<EvidenceBadge id={c.weightGoal.evidenceId} />} className="lg:col-span-2">
            <div className="flex flex-wrap items-end gap-6">
              <Stat size="md" value={c.weightGoal.direction === 'hold' ? '0' : `${c.weightGoal.deltaKg > 0 ? '+' : ''}${c.weightGoal.deltaKg}`} unit="kg" sub="restant" />
              {c.weightGoal.direction !== 'hold' && <Stat size="md" value={c.weightGoal.weeks} unit="semaines" sub={`à ≤ ${c.weightGoal.ratePctPerWeek} %/sem · vers le ${fmtDate(c.weightGoal.etaDate)}`} />}
              <div className="flex-1 min-w-[220px]">
                <div className="h-2 rounded-full bg-surface-2 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${Math.round(Math.min(100, Math.max(0, (Math.abs(c.weightGoal.targetKg - state.profile.startWeightKg) < 0.1 ? 100 : (1 - Math.abs(c.weightGoal.deltaKg) / Math.abs(c.weightGoal.targetKg - state.profile.startWeightKg)) * 100))))}%`, background: 'var(--accent-body)' }} /></div>
                <div className="text-xs text-ink-3 mt-1 tnum">Départ {state.profile.startWeightKg} kg · cible {c.weightGoal.targetKg} kg</div>
              </div>
            </div>
            <p className={cx('text-sm', c.weightGoal.safe ? 'text-ink-2' : 'text-[var(--danger)]')}>{c.weightGoal.message}</p>
          </Card>
        )}
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
                <PhotoFrame photo={SITE_PHOTOS.portraitDark} ratio="3/4" overlay className="max-h-[420px]">
                  <div className="absolute inset-x-5 bottom-5"><Camera className="mb-2 text-white/80" /><div className="font-semibold text-white">{first ? 'Une seule photo pour l’instant' : 'Aucune photo'}</div><p className="text-sm text-white/80 mt-1 max-w-xs">{first ? 'La comparaison apparaîtra avec la prochaine, dans 4 semaines.' : 'Facultatif, mais c’est souvent là que le « wow » arrive : « mon poids n’a presque pas changé… mais mon corps a changé ».'}</p></div>
                </PhotoFrame>
              )}
            </div>
            <div className="space-y-3">
              <div className="card-2 p-3 text-sm"><div className="font-semibold mb-1">Protocole</div><ul className="text-ink-2 space-y-0.5 list-disc pl-4"><li>Même lumière, même endroit</li><li>Même distance (repère au sol)</li><li>Même posture, bras le long du corps</li><li>Matin, avant de manger si possible</li><li>Toutes les 4 semaines</li></ul></div>
              <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ''; }} />
              <button className="btn btn-primary w-full" onClick={() => fileRef.current?.click()}><Camera size={16} /> Ajouter une photo ({view === 'front' ? 'face' : view === 'side' ? 'profil' : 'dos'})</button>
              {photoError && <p className="text-sm text-[var(--danger)]">{photoError}</p>}
              {lastPhoto && (
                <div className="text-sm">
                  <div className="label mb-1.5">Par rapport à la précédente, tu te vois…</div>
                  <Segmented value={lastPhoto.selfAssessment ?? 'same'} onChange={(v) => setPhotoAssessment(lastPhoto.id, v as BodyPhotoMeta['selfAssessment'])} options={[{ value: 'worse', label: 'Moins bien' }, { value: 'same', label: 'Pareil' }, { value: 'better', label: 'Mieux' }]} />
                </div>
              )}
              {lastPhoto && (
                <div className="card-2 p-3 space-y-2">
                  <button className="btn btn-primary w-full" disabled={analyzing} onClick={analyze}><Sparkles size={16} /> {analyzing ? 'Analyse en cours…' : lastPhoto.analysis ? 'Relancer l’analyse IA' : 'Analyser cette photo (IA)'}</button>
                  <label className="flex items-start gap-2 text-xs text-ink-2"><input type="checkbox" className="mt-0.5" checked={state.profile.consents.photoAiAnalysis} onChange={(e) => updateProfile({ consents: { ...state.profile.consents, photoAiAnalysis: e.target.checked } })} /> J’autorise l’envoi de cette photo à un modèle de vision tiers pour une analyse qualitative. Jamais de % de masse grasse, photo non conservée côté serveur.</label>
                  {aiMsg && <p className="text-xs text-ink-2">{aiMsg}</p>}
                </div>
              )}
              <div className="text-xs text-ink-3 flex flex-col gap-1.5"><EvidenceBadge id="photo_bodyfat" /><span>Jamais de % de masse grasse déduit d’une photo. Les photos sont réduites (1280 px) et stockées uniquement dans ce navigateur, non chiffrées : ne les ajoute que sur un appareil personnel. Elles ne sont envoyées au modèle de vision que si tu lances l’analyse.</span></div>
            </div>
          </div>
        </Card>
      </section>

      {(localCheck || lastPhoto?.analysis) && (
        <section className="grid lg:grid-cols-2 gap-4 rise rise-4">
          {localCheck && (
            <Card kicker="Contrôle qualité (sur ton appareil)" title="Cette photo est-elle exploitable ?" accent="body">
              <ul className="space-y-1.5 text-sm">{localCheck.verdicts.map((v) => <li key={v.key} className="flex items-start gap-2"><span className={cx('mt-1.5 w-2 h-2 rounded-full shrink-0', v.level === 'good' ? 'bg-[var(--accent-vitality)]' : v.level === 'ok' ? 'bg-[var(--accent-recovery)]' : 'bg-[var(--accent-muscle)]')} />{v.text}</li>)}</ul>
              <div className="text-xs text-ink-3 tnum">Luminosité {localCheck.brightness}/255 · contraste {localCheck.contrast} · {localCheck.width}×{localCheck.height}</div>
            </Card>
          )}
          {lastPhoto?.analysis && (() => { const a = lastPhoto.analysis!; const qLabel = { poor: 'faible', ok: 'correct', good: 'bon' } as const; const areaLabel: Record<string, string> = { posture: 'Posture', shoulders: 'Épaules', chest: 'Poitrine', arms: 'Bras', abdomen: 'Abdomen', waist: 'Taille', back: 'Dos', legs: 'Jambes', symmetry: 'Symétrie', definition: 'Définition', overall: 'Vue d’ensemble' }; return (
            <Card kicker={`Analyse IA · ${new Date(a.analyzedAt).toLocaleDateString('fr-FR')} · ${a.model}`} title="Ce que l’œil du coach observe" accent="fat" right={<EvidenceBadge id="photo_bodyfat" />} className="lg:col-span-1">
              <div className="flex flex-wrap gap-1.5 text-xs">{(['lighting', 'framing', 'pose'] as const).map((k) => <span key={k} className="chip pointer-events-none h-6 text-[11px]">{({ lighting: 'Lumière', framing: 'Cadrage', pose: 'Pose' } as const)[k]} : {qLabel[a.quality[k]]}</span>)}<span className="chip pointer-events-none h-6 text-[11px]">{a.quality.comparable ? 'Comparable' : 'Peu comparable'}</span></div>
              {a.quality.notes.length > 0 && <p className="text-xs text-ink-2">{a.quality.notes.join(' ')}</p>}
              <ul className="space-y-2 text-sm">{a.observations.map((o, i) => <li key={i} className="flex items-start gap-2"><span className="chip pointer-events-none h-6 text-[11px] shrink-0">{areaLabel[o.area] ?? o.area}</span><span>{o.note} <span className="text-ink-3 text-xs">(confiance {o.confidence === 'high' ? 'élevée' : o.confidence === 'medium' ? 'moyenne' : 'faible'})</span></span></li>)}</ul>
              {a.comparison && <div className="card-2 p-3 text-sm space-y-1.5"><div className="font-semibold">Par rapport à la photo précédente</div><p>{a.comparison.summary}</p>{a.comparison.changes.map((o, i) => <p key={i} className="text-ink-2">· {o.note}</p>)}{a.comparison.caveats.length > 0 && <p className="text-xs text-ink-3">Biais possibles : {a.comparison.caveats.join(' ')}</p>}</div>}
              {a.suggestions.length > 0 && <div><div className="label mb-1">Pistes à confirmer par les mesures</div><ul className="list-disc pl-5 text-sm space-y-1">{a.suggestions.map((x) => <li key={x}>{x}</li>)}</ul></div>}
              {a.safetyFlags.length > 0 && <div className="card-2 border-l-4 border-l-[var(--danger)] px-3 py-2 text-sm flex items-start gap-2"><ShieldCheck size={16} className="mt-0.5 shrink-0" /><span>{a.safetyFlags.join(' ')} Un professionnel de santé est la bonne personne pour en parler.</span></div>}
              <div><div className="label mb-1">Ce que l’IA ne dit pas</div><ul className="list-disc pl-5 text-xs text-ink-2 space-y-0.5">{a.limits.map((x) => <li key={x}>{x}</li>)}</ul></div>
              {a.nextPhotoTips.length > 0 && <div><div className="label mb-1">Prochaine photo</div><ul className="list-disc pl-5 text-xs text-ink-2 space-y-0.5">{a.nextPhotoTips.map((x) => <li key={x}>{x}</li>)}</ul></div>}
            </Card>
          ); })()}
        </section>
      )}

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

/** Redimensionne et compresse l'image côté client (≤ maxPx, JPEG). */
async function compressImage(file: File, maxPx: number, quality: number): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxPx / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas');
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL('image/jpeg', quality);
}
