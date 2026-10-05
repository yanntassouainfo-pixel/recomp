'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/ui/Nav';
import { useStore } from '@/lib/store';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const hydrated = useStore((s) => s.hydrated);
  const hasState = useStore((s) => Boolean(s.state));
  const router = useRouter();
  useEffect(() => { if (hydrated && !hasState) router.replace('/'); }, [hydrated, hasState, router]);
  if (!hydrated) return <div className="min-h-dvh grid place-items-center text-ink-3 text-sm">Chargement…</div>;
  if (!hasState) return null;
  return <AppShell>{children}</AppShell>;
}
