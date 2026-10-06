'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AppMode, Equipment, FoodCulture, Goal, NutritionPrecision, OccupationActivity, Profile, Sex, TrainingLevel, VisualGoal } from '@recomp/engine';
import { Chip, Segmented } from '@/components/ui/Primitives';
import { today, useStore } from '@/lib/store';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

const VISUAL: { v: VisualGoal; l: string }[] = [
  { v: 'leaner', l: 'Plus sec' }, { v: 'athletic', l: 'Plus athlétique' }, { v: 'bigger', l: 'Plus massif' }, { v: 'defined', l: 'Plus dessiné' },
  { v: 'flat_stomach', l: 'Ventre plus plat' }, { v: 'wider_shoulders', l: 'Épaules plus larges' }, { v: 'bigger_arms', l: 'Bras plus développés' },
  { v: 'wider_back', l: 'Dos plus large' }, { v: 'stronger_legs', l: 'Jambes plus musclées' }, { v: 'harmonious', l: 'Physique harmonieux' }, { v: 'sporty', l: 'Silhouette sportive' },
];
const GOALS: { v: Goal; l: string }[] = [
  { v: 'recomposition', l: 'Recomposition corporelle' }, { v: 'fat_loss', l: 'Perdre du gras' }, { v: 'muscle_gain', l: 'Construire du muscle' }, { v: 'athletic', l: 'Devenir plus athlétique' },
  { v: 'strength', l: 'Améliorer la force' }, { v: 'definition', l: 'Définition musculaire' }, { v: 'conditioning', l: 'Condition physique' }, { v: 'energy', l: 'Énergie' }, { v: 'sleep', l: 'Sommeil' }, { v: 'health', l: 'Santé globale' },
];
const CULTURES: { v: FoodCulture; l: string }[] = [
  { v: 'west_africa', l: 'Afrique de l’Ouest' }, { v: 'europe', l: 'Europe' }, { v: 'maghreb', l: 'Maghreb' }, { v: 'middle_east', l: 'Moyen-Orient' }, { v: 'south_asia', l: 'Asie du Sud' }, { v: 'east_asia', l: 'Asie de l’Est' }, { v: 'latin_america', l: 'Amérique latine' },
];
const PREFS = [['vegetarian', 'Végétarien'], ['vegan', 'Végan'], ['halal', 'Halal'], ['no_pork', 'Sans porc'], ['no_fish', 'Sans poisson'], ['lactose_free', 'Sans lactose'], ['gluten_free', 'Sans gluten']] as const;
const ALLERGIES = [['nuts', 'Fruits à coque / arachide'], ['dairy', 'Lait'], ['gluten', 'Gluten'], ['eggs', 'Œufs'], ['fish', 'Poisson / crustacés']] as const;

export default function Onboarding() {
  const router = useRouter();
  const create = useStore((s) => s.createFromProfile);
  const [step, setStep] = useState(0);
  const [visual, setVisual] = useState<VisualGoal[]>([]);
  const [sex, setSex] = useState<Sex>('male');
  const [age, setAge] = useState(35);
  const [height, setHeight] = useState(180);
  const [weight, setWeight] = useState(85);
  const [level, setLevel] = useState<TrainingLevel>('beginner');
  const [sessions, setSessions] = useState(3);
  const [minutes, setMinutes] = useState(45);
  const [equipment, setEquipment] = useState<Equipment>('gym');
  const [occupation, setOccupation] = useState<OccupationActivity>('light');
  const [workHours, setWorkHours] = useState(40);
  const [stepsPerDay, setStepsPerDay] = useState<number | ''>('');
  const [cultures, setCultures] = useState<FoodCulture[]>(['europe']);
  const [prefs, setPrefs] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [goals, setGoals] = useState<Goal[]>(['recomposition']);
  const [primary, setPrimary] = useState<Goal>('recomposition');
  const [priority, setPriority] = useState('');
  const [targetWeight, setTargetWeight] = useState<number | ''>('');
  const [mode, setMode] = useState<AppMode>('simple');
  const [precision, setPrecision] = useState<NutritionPrecision>('simple');
  const [risk, setRisk] = useState({ pregnant: false, minor: false, medicalHistory: false, eatingDisorderHistory: false });
  const [consent, setConsent] = useState({ terms: false, healthData: false, photoAiAnalysis: false, productImprovement: false });
  const [name, setName] = useState('');

  const toggle = <T,>(arr: T[], v: T, set: (x: T[]) => void) => set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const minor = age < 18;
  const errors: string[] = [];
  if (step === 1) {
    if (!(age >= 14 && age <= 90)) errors.push('Âge entre 14 et 90 ans.');
    if (!(height >= 120 && height <= 230)) errors.push('Taille entre 120 et 230 cm.');
    if (!(weight >= 35 && weight <= 250)) errors.push('Poids entre 35 et 250 kg.');
    if (!(sessions >= 2 && sessions <= 6)) errors.push('Entre 2 et 6 séances par semaine.');
    if (!(minutes >= 20 && minutes <= 120)) errors.push('Entre 20 et 120 minutes par séance.');
  }
  if (step === 2 && !(workHours >= 0 && workHours <= 100)) errors.push('Heures de travail entre 0 et 100.');

  const reformulation = useMemo(() => {
    const wantsKeepFrame = visual.includes('bigger') || visual.includes('wider_shoulders') || visual.includes('athletic') || visual.includes('defined');
    if (primary === 'recomposition' || (primary === 'fat_loss' && wantsKeepFrame)) return `Ton objectif n’est pas de peser moins. Ton objectif est de transformer la composition de tes ${weight} kg : moins de gras, autant ou plus de muscle, et une silhouette ${visual.includes('defined') ? 'plus dessinée' : 'plus athlétique'}. On mesurera le tour de taille, la force et l’énergie avant le poids.`;
    if (primary === 'muscle_gain') return `Construire du muscle demande du temps, une progression de force régulière et suffisamment de protéines. Le poids montera lentement ; on vérifiera que le tour de taille reste stable.`;
    if (primary === 'fat_loss') return `Perdre du gras sans perdre de muscle : déficit modéré, protéines hautes, musculation. Si la force baisse ou l’énergie s’effondre, on ralentit — même si la balance « va bien ».`;
    return `Priorité : ${GOALS.find((g) => g.v === primary)?.l.toLowerCase()}. La composition corporelle suivra ; on construit d’abord une routine tenable.`;
  }, [primary, visual, weight]);

  const finish = () => {
    const profile: Profile = {
      id: 'user_' + Math.random().toString(36).slice(2, 8), createdAt: today(), displayName: name || undefined, sex, age, heightCm: height, startWeightKg: weight, level, yearsTraining: level === 'beginner' ? 0 : level === 'intermediate' ? 2 : 5,
      sessionsPerWeek: sessions, sessionMinutes: minutes, equipment, occupation, workHoursPerWeek: workHours, stepsPerDay: stepsPerDay === '' ? undefined : Number(stepsPerDay),
      goals: goals.length ? goals : [primary], primaryGoal: primary, visualGoals: visual, fatStorage: visual.includes('flat_stomach') ? ['abdomen'] : [], priorityStatement: priority || undefined,
      mode: workHours >= 50 && mode === 'simple' ? 'busy' : mode, nutritionPrecision: precision, foodCultures: cultures, dietaryPreferences: prefs, allergies, dislikedFoods: [], limitations: [],
      risk: { ...risk, minor }, consents: { photoAiAnalysis: consent.photoAiAnalysis, productImprovement: consent.productImprovement, notifications: true, healthData: consent.healthData, consentedAt: new Date().toISOString() }, traits: {}, fastingWindow: null,
      mealsPerDay: 3, trainingTimeOfDay: 'evening', trainingDays: [], splitPreference: 'auto', targetWeightKg: targetWeight === '' ? null : Number(targetWeight),
    };
    create(profile);
    router.push('/app');
  };

  const steps = [
    // 0 — Visuel
    <div key="0" className="space-y-5">
      <h1 className="text-3xl font-extrabold tracking-tight">À quoi veux-tu ressembler ?</h1>
      <p className="text-ink-2">Pas « combien veux-tu peser ». Choisis ce qui te parle, plusieurs réponses possibles.</p>
      <div className="flex flex-wrap gap-2">{VISUAL.map((o) => <Chip key={o.v} on={visual.includes(o.v)} onClick={() => toggle(visual, o.v, setVisual)}>{o.l}</Chip>)}</div>
    </div>,
    // 1 — Identité physique
    <div key="1" className="space-y-5">
      <h1 className="text-3xl font-extrabold tracking-tight">Ton point de départ</h1>
      <div className="grid grid-cols-2 gap-3">
        <label className="block"><span className="label">Sexe</span><Segmented className="mt-1 w-full" value={sex} onChange={setSex} options={[{ value: 'male', label: 'Homme' }, { value: 'female', label: 'Femme' }, { value: 'other', label: 'Autre' }]} /></label>
        <label className="block"><span className="label">Âge</span><input className="input mt-1" type="number" value={age} onChange={(e) => setAge(Number(e.target.value))} /></label>
        <label className="block"><span className="label">Taille (cm)</span><input className="input mt-1" type="number" value={height} onChange={(e) => setHeight(Number(e.target.value))} /></label>
        <label className="block"><span className="label">Poids (kg)</span><input className="input mt-1" type="number" step="0.1" value={weight} onChange={(e) => setWeight(Number(e.target.value))} /></label>
      </div>
      <div><span className="label">Expérience en musculation</span><Segmented className="mt-1" value={level} onChange={setLevel} options={[{ value: 'beginner', label: 'Débutant' }, { value: 'intermediate', label: 'Intermédiaire' }, { value: 'advanced', label: 'Avancé' }]} /></div>
      <div className="grid grid-cols-2 gap-3">
        <label className="block"><span className="label">Séances possibles / semaine</span><input className="input mt-1" type="number" min={2} max={6} value={sessions} onChange={(e) => setSessions(Number(e.target.value))} /></label>
        <label className="block"><span className="label">Durée par séance (min)</span><input className="input mt-1" type="number" min={20} max={120} step={5} value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} /></label>
      </div>
      <div><span className="label">Matériel</span><Segmented className="mt-1" value={equipment} onChange={setEquipment} options={[{ value: 'gym', label: 'Salle' }, { value: 'home_basic', label: 'Maison (haltères/élastiques)' }, { value: 'home_none', label: 'Rien' }]} /></div>
    </div>,
    // 2 — Vie
    <div key="2" className="space-y-5">
      <h1 className="text-3xl font-extrabold tracking-tight">Ta vie réelle</h1>
      <p className="text-ink-2">Le meilleur programme est celui que tu peux tenir. On adapte à ta semaine, pas l’inverse.</p>
      <div><span className="label">Activité professionnelle</span><Segmented className="mt-1" value={occupation} onChange={setOccupation} options={[{ value: 'sedentary', label: 'Assis' }, { value: 'light', label: 'Léger' }, { value: 'active', label: 'Actif' }, { value: 'very_active', label: 'Physique' }]} /></div>
      <div className="grid grid-cols-2 gap-3">
        <label className="block"><span className="label">Heures de travail / semaine</span><input className="input mt-1" type="number" value={workHours} onChange={(e) => setWorkHours(Number(e.target.value))} /></label>
        <label className="block"><span className="label">Pas / jour (si connu)</span><input className="input mt-1" type="number" placeholder="ex. 6500" value={stepsPerDay} onChange={(e) => setStepsPerDay(e.target.value === '' ? '' : Number(e.target.value))} /></label>
      </div>
      <div><span className="label">Culture alimentaire (plusieurs possibles)</span><div className="flex flex-wrap gap-2 mt-1.5">{CULTURES.map((c) => <Chip key={c.v} on={cultures.includes(c.v)} onClick={() => toggle(cultures, c.v, setCultures)}>{c.l}</Chip>)}</div></div>
      <div><span className="label">Préférences</span><div className="flex flex-wrap gap-2 mt-1.5">{PREFS.map(([v, l]) => <Chip key={v} on={prefs.includes(v)} onClick={() => toggle(prefs, v, setPrefs)}>{l}</Chip>)}</div></div>
      <div><span className="label">Allergies</span><div className="flex flex-wrap gap-2 mt-1.5">{ALLERGIES.map(([v, l]) => <Chip key={v} on={allergies.includes(v)} onClick={() => toggle(allergies, v, setAllergies)}>{l}</Chip>)}</div></div>
    </div>,
    // 3 — Priorité & mode
    <div key="3" className="space-y-5">
      <h1 className="text-3xl font-extrabold tracking-tight">Qu’est-ce qui compte le plus pour toi actuellement ?</h1>
      <div className="flex flex-wrap gap-2">{GOALS.map((g) => <Chip key={g.v} on={primary === g.v} onClick={() => { setPrimary(g.v); if (!goals.includes(g.v)) setGoals([g.v, ...goals]); }}>{g.l}</Chip>)}</div>
      <div><span className="label">Objectifs secondaires</span><div className="flex flex-wrap gap-2 mt-1.5">{GOALS.filter((g) => g.v !== primary).map((g) => <Chip key={g.v} on={goals.includes(g.v)} onClick={() => toggle(goals, g.v, setGoals)}>{g.l}</Chip>)}</div></div>
      <label className="block"><span className="label">En une phrase (facultatif)</span><input className="input mt-1" placeholder="ex. Être plus dessiné sans perdre ma carrure" value={priority} onChange={(e) => setPriority(e.target.value)} /></label>
      <div className="card-2 p-4">
        <label className="block"><span className="label">Objectif de poids (facultatif)</span>
          <div className="flex items-center gap-3 mt-1"><input className="input w-32" type="number" step="0.5" placeholder="kg" value={targetWeight} onChange={(e) => setTargetWeight(e.target.value === '' ? '' : Number(e.target.value))} /><span className="text-sm text-ink-2">{targetWeight !== '' && weight ? (targetWeight < weight ? `−${(weight - targetWeight).toFixed(1)} kg, soit environ ${Math.ceil(Math.log(targetWeight / weight) / Math.log(1 - 0.006))} semaines à un rythme qui préserve le muscle` : targetWeight > weight ? `+${(targetWeight - weight).toFixed(1)} kg, soit environ ${Math.ceil(Math.log(targetWeight / weight) / Math.log(1 + 0.003))} semaines pour une prise surtout musculaire` : 'Poids stable : l’objectif devient la composition') : 'Un repère, pas une sentence : le tour de taille et la force comptent autant.'}</span></div>
        </label>
        {targetWeight !== '' && height && targetWeight / ((height / 100) ** 2) < 18.5 && <p className="text-xs text-[var(--danger)] mt-2">Ce poids correspond à un IMC inférieur à 18,5 : le coach ne programmera pas de déficit vers cette cible.</p>}
      </div>
      <div><span className="label">Mode</span><Segmented className="mt-1" value={mode} onChange={setMode} options={[{ value: 'simple', label: 'Simple' }, { value: 'busy', label: 'Busy (minimum efficace)' }, { value: 'performance', label: 'Performance' }]} /></div>
      <div><span className="label">Nutrition</span><Segmented className="mt-1" value={precision} onChange={setPrecision} options={[{ value: 'simple', label: 'Portions visuelles' }, { value: 'precise', label: 'Grammes & macros' }]} /><p className="text-xs text-ink-3 mt-1.5">Tu peux changer à tout moment. Personne ne t’imposera le comptage.</p></div>
    </div>,
    // 4 — Sécurité & consentements
    <div key="4" className="space-y-5">
      <h1 className="text-3xl font-extrabold tracking-tight">Quelques points de sécurité</h1>
      <p className="text-ink-2">Ils changent la manière dont on t’accompagne. Aucune réponse aux questions de sécurité n’est bloquante ; seules les deux premières cases de consentement sont nécessaires.</p>
      {[
        ['pregnant', 'Je suis enceinte ou en post-partum récent'],
        ['medicalHistory', 'J’ai un antécédent médical important (cardiaque, métabolique, articulaire…)'],
        ['eatingDisorderHistory', 'J’ai (eu) un rapport difficile à l’alimentation ou un trouble alimentaire'],
      ].map(([k, l]) => (
        <label key={k} className="flex items-start gap-3 card-2 p-4 cursor-pointer">
          <input type="checkbox" className="mt-1" checked={risk[k as keyof typeof risk]} onChange={(e) => setRisk({ ...risk, [k as string]: e.target.checked })} />
          <span className="text-sm">{l}</span>
        </label>
      ))}
      {minor && <div className="card-2 p-4 text-sm border-l-4 border-l-[var(--accent-recovery)]">Tu as moins de 18 ans : l’application restera en mode accompagnement général (pas de déficit, pas de cibles agressives) et recommande un suivi par un adulte référent ou un professionnel.</div>}
      <label className="block"><span className="label">Prénom (facultatif)</span><input className="input mt-1" value={name} onChange={(e) => setName(e.target.value)} /></label>
      <div className="space-y-2">
        <label className="flex items-start gap-3 text-sm"><input type="checkbox" className="mt-1" checked={consent.terms} onChange={(e) => setConsent({ ...consent, terms: e.target.checked })} /> J’ai compris que RECOMP n’est pas un dispositif médical et j’ai lu la <a href="/confidentialite" target="_blank" className="underline">politique de confidentialité</a> et les <a href="/mentions-legales" target="_blank" className="underline">mentions légales</a>.</label>
        <label className="flex items-start gap-3 text-sm"><input type="checkbox" className="mt-1" checked={consent.healthData} onChange={(e) => setConsent({ ...consent, healthData: e.target.checked })} /> J’accepte que RECOMP traite mes mesures corporelles, check-ins (énergie, sommeil, stress, douleurs) et informations de santé déclarées pour personnaliser mon coaching. Ces données restent dans ce navigateur ; export et suppression à tout moment.</label>
        <label className="flex items-start gap-3 text-sm text-ink-2"><input type="checkbox" className="mt-1" checked={consent.photoAiAnalysis} onChange={(e) => setConsent({ ...consent, photoAiAnalysis: e.target.checked })} /> J’autorise l’analyse IA de mes photos par un modèle de vision tiers (observations qualitatives uniquement, jamais de % de masse grasse, photos non conservées côté serveur). Facultatif, révocable dans le profil.</label>
        <label className="flex items-start gap-3 text-sm text-ink-2"><input type="checkbox" className="mt-1" checked={consent.productImprovement} onChange={(e) => setConsent({ ...consent, productImprovement: e.target.checked })} /> J’accepte que des données anonymisées servent à améliorer le produit. Facultatif, jamais pour les photos.</label>
      </div>
    </div>,
    // 5 — Reformulation
    <div key="5" className="space-y-5">
      <div className="label">Ce que nous avons compris</div>
      <h1 className="text-3xl font-extrabold tracking-tight leading-tight">{reformulation}</h1>
      <div className="card-2 p-4 text-sm space-y-1.5">
        <div><span className="text-ink-3">Séances :</span> {sessions} × {minutes} min · {equipment === 'gym' ? 'salle' : equipment === 'home_basic' ? 'maison avec matériel' : 'sans matériel'}</div>
        <div><span className="text-ink-3">Mode :</span> {workHours >= 50 && mode === 'simple' ? 'Busy (semaine chargée détectée)' : mode} · nutrition {precision === 'simple' ? 'en portions' : 'en grammes'}</div>
        <div><span className="text-ink-3">Cuisine :</span> {cultures.map((c) => CULTURES.find((x) => x.v === c)?.l).join(', ')}</div>
      </div>
      <p className="text-sm text-ink-2">Le reste (morphologie, habitudes, contraintes) se complète au fil des jours, via le check-in et le coach. Tu n’auras jamais à tout saisir d’un coup.</p>
    </div>,
  ];

  const canNext = step === 4 ? consent.terms && consent.healthData : errors.length === 0;
  return (
    <div className="min-h-dvh flex flex-col">
      <header className="max-w-2xl w-full mx-auto px-5 h-16 flex items-center justify-between">
        <span className="font-bold tracking-tight">RECOMP</span>
        <div className="flex items-center gap-3">
          <div className="flex gap-1">{steps.map((_, i) => <span key={i} className="h-1.5 w-6 rounded-full transition-colors" style={{ background: i <= step ? 'var(--accent-body)' : 'var(--line)' }} />)}</div>
          <ThemeToggle />
        </div>
      </header>
      <main className="max-w-2xl w-full mx-auto px-5 py-6 flex-1 rise" key={step}>{steps[step]}</main>
      <footer className="max-w-2xl w-full mx-auto px-5 py-5 flex items-center justify-between gap-3 sticky bottom-0 glass md:bg-transparent md:border-0">
        <button className="btn btn-ghost" disabled={step === 0} onClick={() => setStep(step - 1)}><ArrowLeft size={16} /> Retour</button>
        {step < steps.length - 1 ? (
          <div className="flex flex-col items-end gap-1">
            <button className="btn btn-primary" disabled={!canNext} onClick={() => setStep(step + 1)}>Continuer <ArrowRight size={16} /></button>
            {!canNext && <span className="text-[11px] text-ink-3 text-right">{step === 4 ? 'Coche les deux premières cases pour continuer.' : errors.join(' ')}</span>}
          </div>
        ) : (
          <button className="btn btn-primary" onClick={finish}>Voir mon plan du jour <ArrowRight size={16} /></button>
        )}
      </footer>
    </div>
  );
}
