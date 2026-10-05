'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useStore } from '@/lib/store';
import { ArrowRight, Sparkles, Check, Mail } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { EvidenceBadge } from '@/components/ui/Evidence';
import { EVIDENCE } from '@recomp/engine';

const PILLARS: [string, string, string, string][] = [
  ['01', 'Composition', 'Graisse, masse maigre, mensurations, évolution visuelle.', 'var(--accent-fat)'],
  ['02', 'Muscle', 'Hypertrophie, force, progression, volume.', 'var(--accent-muscle)'],
  ['03', 'Nutrition', 'Qualité, quantité, protéines, timing, hydratation.', 'var(--accent-nutrition)'],
  ['04', 'Mouvement', 'Musculation, pas quotidiens, cardio, mobilité.', 'var(--accent-consistency)'],
  ['05', 'Sommeil', 'Durée, régularité, qualité, récupération.', 'var(--accent-body)'],
  ['06', 'Stress & récupération', 'Charge mentale, fatigue, capacité à encaisser.', 'var(--accent-recovery)'],
  ['07', 'Adhérence & plaisir', 'Ce que tu peux vraiment tenir pendant des mois.', 'var(--accent-vitality)'],
];

const FAQ: [string, string][] = [
  ['Combien ça coûte ?', 'Gratuit pendant la bêta. Le tarif sera annoncé avant toute fin de bêta ; les premiers testeurs garderont des conditions préférentielles.'],
  ['C’est une IA, c’est fiable ?', 'Les chiffres (calories, protéines, charges, séries) viennent d’un moteur déterministe, testé, avec un niveau de preuve affiché. L’IA ne fait qu’expliquer et converser ; elle ne décide jamais d’une cible. Sans clé IA, le coach répond quand même.'],
  ['Et si je n’ai pas de salle ?', 'Le programme se génère pour une salle, une maison avec haltères ou élastiques, ou rien du tout. Une semaine sans salle se déclare en un clic et le plan se recompose.'],
  ['Je suis une femme, c’est pour moi ?', 'Oui. Les cibles sont calculées à partir de ton profil (sexe, âge, taille, poids, activité), et le score de composition ne dépend pas du poids. Grossesse ou post-partum : l’application bascule en accompagnement sans déficit.'],
  ['Mes photos vont où ?', 'Dans ton navigateur, sur ton appareil, réduites à 1280 px. Elles ne sont jamais envoyées au coach ni à un serveur, et jamais utilisées pour entraîner un modèle.'],
  ['Ça marche sans compter les calories ?', 'Oui : mode « portions » (paumes, poings, pouces, assiette) ou mode « grammes ». Tu choisis, tu changes quand tu veux.'],
  ['Quelle différence avec MyFitnessPal ou Freeletics ?', 'Eux suivent le poids ou proposent des séances. RECOMP relie nutrition, entraînement, sommeil et récupération dans un seul moteur, remplace le poids par un score de composition, s’adapte à ta vie (restaurant, voyage, Ramadan) et sait ne rien changer quand ça marche.'],
];

function Waitlist({ compact }: { compact?: boolean }) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle');
  const endpoint = process.env.NEXT_PUBLIC_WAITLIST_URL;
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) return;
    if (!endpoint) {
      window.location.href = `mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? 'contact@recomp.app'}?subject=${encodeURIComponent('Rejoindre la bêta RECOMP')}&body=${encodeURIComponent(`Bonjour, je souhaite rejoindre la bêta. Mon e-mail : ${email}`)}`;
      setState('ok');
      return;
    }
    setState('sending');
    try {
      const res = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json' }, body: JSON.stringify({ email, source: 'landing' }) });
      setState(res.ok ? 'ok' : 'error');
    } catch {
      setState('error');
    }
  };
  if (state === 'ok') return <div className="card-2 p-4 text-sm flex items-center gap-2"><Check size={16} className="text-[var(--accent-vitality)]" /> Merci. Un seul e-mail, quand ta place est prête.</div>;
  return (
    <form onSubmit={submit} className={compact ? 'flex gap-2' : 'flex flex-col sm:flex-row gap-2'}>
      <input className="input" type="email" required placeholder="ton@email.com" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="E-mail" />
      <button className="btn btn-primary shrink-0" disabled={state === 'sending'}><Mail size={16} /> Rejoindre la bêta</button>
      {state === 'error' && <span className="text-xs text-[var(--danger)] self-center">Échec de l’envoi, réessaie.</span>}
    </form>
  );
}

export default function Landing() {
  const router = useRouter();
  const loadDemo = useStore((s) => s.loadDemo);
  const hasState = useStore((s) => Boolean(s.state));
  const hydrated = useStore((s) => s.hydrated);
  const evidence = [EVIDENCE.protein_intake, EVIDENCE.waist_marker, EVIDENCE.time_restricted_eating];
  return (
    <div className="min-h-dvh">
      <header className="max-w-6xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5"><span className="w-8 h-8 rounded-xl grid place-items-center font-black text-sm text-white" style={{ background: 'linear-gradient(135deg, var(--accent-fat), var(--accent-body))' }}>R</span><span className="font-bold tracking-tight">RECOMP</span><span className="chip pointer-events-none hidden sm:inline-flex">Bêta gratuite</span></div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {hydrated && hasState && <Link href="/app" className="btn btn-secondary btn-sm">Ouvrir mon espace <ArrowRight size={16} /></Link>}
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-5 md:px-8 pt-10 md:pt-20 pb-14 grid md:grid-cols-[1.1fr_0.9fr] gap-10 items-center">
        <div className="rise">
          <div className="label mb-4">Coach de recomposition corporelle</div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.02]">Devenir meilleur<br /><span className="text-gradient">à poids comparable.</span></h1>
          <p className="text-lg text-ink-2 mt-6 max-w-xl">Un coach qui mesure ce que la balance ne voit pas, s’adapte à ta vie, et connaît ta cuisine. Pour les adultes qui travaillent, qui mangent dehors, et qui en ont assez de « mange moins ».</p>
          <div className="flex flex-wrap gap-3 mt-8">
            <Link href="/onboarding" className="btn btn-accent">Commencer (2 min) <ArrowRight size={16} /></Link>
            <button className="btn btn-secondary" onClick={() => { loadDemo(); router.push('/app'); }}><Sparkles size={16} /> Explorer avec le profil démo</button>
          </div>
          <p className="text-xs text-ink-3 mt-4">Pas de carte bancaire. Rien ne quitte ton navigateur. Démo : 8 semaines de données simulées.</p>
          <div className="mt-6 max-w-md"><Waitlist compact /></div>
        </div>
        <div className="card p-6 md:p-8 rise rise-2">
          <div className="label mb-3">Trois trajectoires, une balance aveugle</div>
          <div className="space-y-3">
            {[
              ['93 → 92 kg', 'Transformation visuelle spectaculaire.', 'Le poids ne la montre pas.', 'var(--accent-body)'],
              ['68 → 68 kg', 'Moins de gras, plus de muscle, plus dessinée.', 'La balance dit « rien ».', 'var(--accent-fat)'],
              ['93 → 95 kg', 'Plus sec, plus musclé, plus large.', 'La balance dit « échec ».', 'var(--accent-muscle)'],
            ].map(([w, a, b, c]) => (
              <div key={w} className="flex items-start gap-4 card-2 p-4 border-l-4" style={{ borderLeftColor: c }}>
                <div className="font-bold tnum text-lg w-28 shrink-0">{w}</div>
                <div><div className="font-medium">{a}</div><div className="text-sm text-ink-2">{b}</div></div>
              </div>
            ))}
          </div>
          <p className="text-sm text-ink-2 mt-5">RECOMP mesure tour de taille, force, énergie, sommeil, récupération et régularité. Et sait quand ne rien changer.</p>
        </div>
      </section>

      {/* Comment on le mesure */}
      <section className="max-w-6xl mx-auto px-5 md:px-8 pb-16">
        <div className="label mb-2">Comment on le mesure</div>
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-6">Un score de composition, pas un chiffre sur la balance</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            ['Tour de taille · 30 %', 'Le marqueur le plus fiable de la graisse abdominale, mesuré une fois par semaine.', 'var(--accent-fat)'],
            ['Force · 20 %', 'Si tes charges montent, ton muscle est au minimum préservé. La balance ne le sait pas.', 'var(--accent-muscle)'],
            ['Régularité, sommeil, énergie · 35 %', 'Un résultat obtenu en s’épuisant n’est pas un résultat. Le poids ne pèse que 10 %.', 'var(--accent-vitality)'],
          ].map(([t, d, c]) => (
            <div key={t} className="card p-5 border-t-4" style={{ borderTopColor: c }}><div className="font-semibold">{t}</div><p className="text-sm text-ink-2 mt-1">{d}</p></div>
          ))}
        </div>
        <div className="grid md:grid-cols-3 gap-4 mt-4">
          {evidence.map((e) => (
            <div key={e.id} className="card-2 p-4">
              <div className="flex items-start justify-between gap-3"><div className="font-semibold text-sm">{e.title}</div><EvidenceBadge level={e.level} /></div>
              <p className="text-xs text-ink-2 mt-2">{e.whatWeDo}</p>
            </div>
          ))}
        </div>
        <p className="text-sm text-ink-2 mt-4">Chaque conseil porte son niveau de preuve : solide, probable, incertain, ou approche. Sans dogme : ni pro-jeûne ni anti-jeûne, ni pro-cardio ni anti-cardio.</p>
      </section>

      {/* Ton mafé */}
      <section className="max-w-6xl mx-auto px-5 md:px-8 pb-16">
        <div className="card p-6 md:p-10 grid md:grid-cols-[1fr_1fr] gap-8 items-center" data-accent="nutrition" style={{ '--card-accent': 'var(--accent-nutrition)' } as React.CSSProperties}>
          <div>
            <div className="label mb-2">Vraie vie</div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Tu peux garder ton mafé.</h2>
            <p className="text-ink-2 mt-4">La plupart des apps ne connaissent que le poulet-riz-brocoli. RECOMP connaît l’attiéké, le foutou, le thiéboudienne, le tô, la sauce feuilles, la sauce graine, et te dit comment ajuster ta portion, pas la supprimer.</p>
            <p className="text-sm text-ink-3 mt-3">Base alimentaire : Afrique de l’Ouest, Maghreb, Europe, Moyen-Orient, Asie, Amérique latine. Préférences, allergies, halal, végétarien, sans lactose, sans gluten.</p>
          </div>
          <div className="card-2 p-5 text-sm space-y-2">
            <div className="label">Exemple · jour de repos</div>
            <div className="font-semibold">Sauce arachide (mafé) avec riz</div>
            <ul className="list-disc pl-4 text-ink-2 space-y-1">
              <li>Mafé : vise environ 250 g, soit 2 louches. La sauce est riche, c’est elle qui fait la différence.</li>
              <li>Ajoute ~100 g de poisson, poulet ou œufs pour atteindre tes protéines.</li>
              <li>Riz : environ 200 g cuit, portion un peu plus petite qu’un jour d’entraînement.</li>
              <li>Une part de légumes ou de crudités à côté.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Un coach qui sait attendre */}
      <section className="max-w-6xl mx-auto px-5 md:px-8 pb-16">
        <div className="label mb-2">Un coach qui sait attendre</div>
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-6">Ta vie ne s’adapte pas au plan. C’est l’inverse.</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            ['Life Mode', 'Restaurant, voyage, Ramadan, semaine à 55 h, pas de salle : tu le déclares, le coach recompose le plan. Aucune compensation après un repas libre.', 'var(--accent-consistency)'],
            ['Plateau Detector', 'Quand ton corps progresse sans que la balance bouge, il te le dit, et ne change rien. Un vrai plateau demande 3 semaines, 4 signaux et une bonne régularité.', 'var(--accent-body)'],
            ['Programme en 12 semaines', 'Fondation, construction, semaine allégée, intensification, consolidation : un calendrier qui place les séances, les mesures et les photos.', 'var(--accent-muscle)'],
          ].map(([t, d, c]) => (
            <div key={t} className="card p-5 border-t-4" style={{ borderTopColor: c }}><div className="font-semibold">{t}</div><p className="text-sm text-ink-2 mt-1">{d}</p></div>
          ))}
        </div>
      </section>

      {/* Piliers */}
      <section className="max-w-6xl mx-auto px-5 md:px-8 pb-16">
        <div className="label mb-5">Sept piliers, un moteur</div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PILLARS.map(([n, t, d, c], i) => (
            <div key={n} className={`card p-5 rise rise-${(i % 6) + 1} border-t-4`} style={{ borderTopColor: c }}>
              <div className="text-xs font-bold tnum" style={{ color: c }}>{n}</div>
              <div className="font-semibold mt-1">{t}</div>
              <div className="text-sm text-ink-2 mt-1">{d}</div>
            </div>
          ))}
          <div className="card p-5 text-white rise rise-6" style={{ background: 'linear-gradient(135deg, var(--accent-body), var(--accent-fat))', border: 0 }}>
            <div className="text-xs font-bold opacity-60">Règle</div>
            <div className="font-semibold mt-1">Le meilleur programme est celui que tu peux maintenir.</div>
            <div className="text-sm opacity-70 mt-1">La complexité est dans le moteur. La simplicité dans l’interface.</div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-5 md:px-8 pb-16">
        <div className="label mb-2">Questions fréquentes</div>
        <div className="divide-y divide-line card px-5">
          {FAQ.map(([q, a]) => (
            <details key={q} className="py-4 group">
              <summary className="cursor-pointer font-semibold list-none flex items-center justify-between gap-3">{q}<span className="text-ink-3 group-open:rotate-45 transition-transform">+</span></summary>
              <p className="text-sm text-ink-2 mt-2">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="max-w-6xl mx-auto px-5 md:px-8 pb-20">
        <div className="card p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight">Deux minutes. Pas de carte bancaire.<br />Rien ne quitte ton navigateur.</h2>
          <p className="text-ink-2 mt-3">Rejoins les 100 premiers bêta-testeurs, ou commence tout de suite.</p>
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            <Link href="/onboarding" className="btn btn-accent">Commencer (2 min) <ArrowRight size={16} /></Link>
            <button className="btn btn-secondary" onClick={() => { loadDemo(); router.push('/app'); }}><Sparkles size={16} /> Voir la démo</button>
          </div>
          <div className="max-w-md mx-auto mt-6"><Waitlist /></div>
        </div>
      </section>

      <footer className="max-w-6xl mx-auto px-5 md:px-8 pb-10 text-xs text-ink-3 space-y-2">
        <p>RECOMP n’est pas un dispositif médical et ne remplace pas un professionnel de santé. Tes données restent dans ton navigateur et ne servent jamais à entraîner un modèle sans consentement explicite.</p>
        <p><Link href="/confidentialite" className="underline">Politique de confidentialité</Link> · <Link href="/mentions-legales" className="underline">Mentions légales</Link> · <a href={`mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? 'contact@recomp.app'}`} className="underline">Contact</a> · <a href="https://github.com/yanntassouainfo-pixel/recomp" className="underline">Code source</a></p>
      </footer>
    </div>
  );
}
