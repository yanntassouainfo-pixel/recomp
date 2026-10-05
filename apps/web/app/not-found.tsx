import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-dvh grid place-items-center px-5">
      <div className="card p-8 max-w-md text-center space-y-4">
        <div className="label">Erreur 404</div>
        <h1 className="text-2xl font-extrabold tracking-tight">Cette page n’existe pas.</h1>
        <p className="text-ink-2 text-sm">Le poids n’est qu’une donnée parmi d’autres ; cette adresse, elle, n’en est pas une.</p>
        <div className="flex justify-center gap-2"><Link href="/" className="btn btn-primary">Accueil</Link><Link href="/app" className="btn btn-secondary">Mon espace</Link></div>
      </div>
    </main>
  );
}
