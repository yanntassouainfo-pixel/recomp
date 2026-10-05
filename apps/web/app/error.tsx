'use client';
import Link from 'next/link';

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const exportData = () => {
    try {
      const raw = localStorage.getItem('recomp-v1');
      if (!raw) return;
      const blob = new Blob([raw], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'recomp-sauvegarde.json'; a.click();
    } catch { /* stockage indisponible */ }
  };
  return (
    <main className="min-h-dvh grid place-items-center px-5">
      <div className="card p-8 max-w-md text-center space-y-4">
        <h1 className="text-2xl font-extrabold tracking-tight">Quelque chose a cassé.</h1>
        <p className="text-ink-2 text-sm">Tes données sont intactes dans ce navigateur. Tu peux recharger la page ou les exporter par sécurité.</p>
        <div className="flex flex-wrap justify-center gap-2">
          <button className="btn btn-primary" onClick={reset}>Recharger</button>
          <button className="btn btn-secondary" onClick={exportData}>Exporter mes données</button>
          <Link href="/" className="btn btn-ghost">Accueil</Link>
        </div>
      </div>
    </main>
  );
}
