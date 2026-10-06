import Link from 'next/link';
import { EXERCISE_PHOTOS, SITE_PHOTOS } from '@recomp/engine';

export const metadata = { title: 'Mentions légales — RECOMP' };

export default function MentionsLegales() {
  return (
    <main className="max-w-3xl mx-auto px-5 py-12 space-y-6 text-[15px] leading-relaxed">
      <Link href="/" className="text-sm text-ink-2 hover:text-ink">← Retour</Link>
      <h1 className="text-3xl font-extrabold tracking-tight">Mentions légales</h1>
      <h2 className="font-bold text-xl">Éditeur</h2>
      <p>[À compléter : nom ou raison sociale, forme juridique, adresse, e-mail, numéro SIREN le cas échéant, directeur de la publication].</p>
      <h2 className="font-bold text-xl">Hébergement</h2>
      <p>GitHub Pages — GitHub, Inc., 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, États-Unis (version de démonstration).</p>
      <h2 className="font-bold text-xl">Avertissement santé</h2>
      <p>RECOMP fournit un accompagnement général en nutrition, entraînement et habitudes de vie. Il ne constitue pas un avis médical, ne diagnostique aucune pathologie et ne remplace pas un professionnel de santé. En cas de douleur persistante, de symptômes inquiétants, de grossesse, de trouble alimentaire ou d’antécédent médical, consulte un professionnel avant de suivre les recommandations.</p>
      <h2 className="font-bold text-xl">Propriété intellectuelle</h2>
      <p>Le code et les contenus de RECOMP sont la propriété de l’éditeur. Les repères bibliographiques cités appartiennent à leurs auteurs.</p>
      <h2 className="font-bold text-xl">Crédits photos</h2>
      <p>Photos d’illustration sous licence Unsplash. Elles ne représentent ni des utilisateurs ni des résultats. {[...new Map([...Object.values(SITE_PHOTOS), ...Object.values(EXERCISE_PHOTOS)].map((p) => [p.credit, p])).values()].map((p, i, arr) => <span key={p.credit}><a href={p.creditUrl} className="underline" target="_blank" rel="noreferrer">{p.credit}</a>{i < arr.length - 1 ? ', ' : '.'}</span>)}</p>
      <p><Link href="/confidentialite" className="underline">Politique de confidentialité</Link></p>
    </main>
  );
}
