'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { ArrowRight, Sparkles } from 'lucide-react';

const PILLARS = [
  ['01', 'Composition', 'Graisse, masse maigre, mensurations, évolution visuelle.'],
  ['02', 'Muscle', 'Hypertrophie, force, progression, volume.'],
  ['03', 'Nutrition', 'Qualité, quantité, protéines, timing, hydratation.'],
  ['04', 'Mouvement', 'Musculation, pas quotidiens, cardio, mobilité.'],
  ['05', 'Sommeil', 'Durée, régularité, qualité, récupération.'],
  ['06', 'Stress & récupération', 'Charge mentale, fatigue, capacité à encaisser.'],
  ['07', 'Adhérence & plaisir', 'Ce que tu peux vraiment tenir pendant des mois.'],
];

export default function Landing() {
  const router = useRouter();
  const loadDemo = useStore((s) => s.loadDemo);
  const hasState = useStore((s) => Boolean(s.state));
  const hydrated = useStore((s) => s.hydrated);
  return (
    <div className="min-h-dvh">
      <header className="max-w-6xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5"><span className="w-8 h-8 rounded-xl bg-ink text-bg grid place-items-center font-black text-sm">R</span><span className="font-bold tracking-tight">RECOMP</span></div>
        {hydrated && hasState && <Link href="/app" className="btn btn-secondary btn-sm">Ouvrir mon espace <ArrowRight size={16} /></Link>}
      </header>
      <section className="max-w-6xl mx-auto px-5 md:px-8 pt-10 md:pt-20 pb-16 grid md:grid-cols-[1.1fr_0.9fr] gap-10 items-center">
        <div className="rise">
          <div className="label mb-4">Coach de recomposition corporelle</div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.02]">Devenir meilleur<br />à poids comparable.</h1>
          <p className="text-lg text-ink-2 mt-6 max-w-xl">Perdre du gras. Préserver ou construire du muscle. Améliorer la silhouette. Gagner en vitalité. Sans transformer ta vie en prison. Le poids n’est qu’une donnée parmi d’autres.</p>
          <div className="flex flex-wrap gap-3 mt-8">
            <Link href="/onboarding" className="btn btn-primary">Commencer (2 min) <ArrowRight size={16} /></Link>
            <button className="btn btn-secondary" onClick={() => { loadDemo(); router.push('/app'); }}><Sparkles size={16} /> Explorer avec le profil démo</button>
          </div>
          <p className="text-xs text-ink-3 mt-4">Démo : homme, 1,92 m, 93 kg, 8 semaines de données simulées. Aucune donnée n’est envoyée à un serveur ; tout reste dans ton navigateur.</p>
        </div>
        <div className="card p-6 md:p-8 rise rise-2">
          <div className="label mb-3">Trois trajectoires, une balance aveugle</div>
          <div className="space-y-4">
            {[
              ['93 → 92 kg', 'Transformation visuelle spectaculaire.', 'Le poids ne la montre pas.'],
              ['93 → 93 kg', 'Moins de gras, plus de muscle.', 'La balance dit « rien ».'],
              ['93 → 95 kg', 'Plus sec, plus musclé, plus large.', 'La balance dit « échec ».'],
            ].map(([w, a, b]) => (
              <div key={w} className="flex items-start gap-4 card-2 p-4">
                <div className="font-bold tnum text-lg w-28 shrink-0">{w}</div>
                <div><div className="font-medium">{a}</div><div className="text-sm text-ink-2">{b}</div></div>
              </div>
            ))}
          </div>
          <p className="text-sm text-ink-2 mt-5">RECOMP mesure ce que la balance ne voit pas : tour de taille, force, énergie, sommeil, récupération, régularité. Et sait quand ne rien changer.</p>
        </div>
      </section>
      <section className="max-w-6xl mx-auto px-5 md:px-8 pb-24">
        <div className="label mb-5">Sept piliers, un moteur</div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PILLARS.map(([n, t, d], i) => (
            <div key={n} className={`card p-5 rise rise-${(i % 6) + 1}`}>
              <div className="text-xs font-bold text-ink-3 tnum">{n}</div>
              <div className="font-semibold mt-1">{t}</div>
              <div className="text-sm text-ink-2 mt-1">{d}</div>
            </div>
          ))}
          <div className="card p-5 bg-ink text-bg rise rise-6">
            <div className="text-xs font-bold opacity-60">Règle</div>
            <div className="font-semibold mt-1">Le meilleur programme est celui que tu peux maintenir.</div>
            <div className="text-sm opacity-70 mt-1">La complexité est dans le moteur. La simplicité dans l’interface.</div>
          </div>
        </div>
      </section>
      <footer className="max-w-6xl mx-auto px-5 md:px-8 pb-10 text-xs text-ink-3">RECOMP n’est pas un dispositif médical et ne remplace pas un professionnel de santé. Les photos et données personnelles restent privées et ne servent jamais à entraîner un modèle sans consentement explicite.</footer>
    </div>
  );
}
