'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Dumbbell, UtensilsCrossed, Scan, MessageCircle, BarChart3, UserRound, CalendarDays, MoreHorizontal, X, BookOpen } from 'lucide-react';
import { cx } from '@/lib/format';
import { ThemeToggle } from './ThemeToggle';

const ITEMS = [
  { href: '/app', label: 'Aujourd’hui', short: 'Accueil', icon: Home },
  { href: '/app/plan', label: 'Planning', short: 'Plan', icon: CalendarDays },
  { href: '/app/train', label: 'Entraînement', short: 'Séance', icon: Dumbbell },
  { href: '/app/exercises', label: 'Exercices', short: 'Exercices', icon: BookOpen },
  { href: '/app/food', label: 'Nutrition', short: 'Assiette', icon: UtensilsCrossed },
  { href: '/app/body', label: 'Transformation', short: 'Corps', icon: Scan },
  { href: '/app/coach', label: 'Coach', short: 'Coach', icon: MessageCircle },
  { href: '/app/review', label: 'Bilans', short: 'Bilans', icon: BarChart3 },
  { href: '/app/profile', label: 'Profil', short: 'Profil', icon: UserRound },
];

const NAV_COLORS: Record<string, string> = { '/app': 'var(--accent-vitality)', '/app/plan': 'var(--accent-body)', '/app/train': 'var(--accent-muscle)', '/app/exercises': 'var(--accent-muscle)', '/app/program': 'var(--accent-muscle)', '/app/food': 'var(--accent-nutrition)', '/app/body': 'var(--accent-fat)', '/app/coach': 'var(--accent-body)', '/app/review': 'var(--accent-consistency)', '/app/profile': 'var(--accent-recovery)' };

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [more, setMore] = useState(false);
  const active = (href: string) => (href === '/app' ? path === '/app' : href === '/app/train' ? path.startsWith('/app/train') || path.startsWith('/app/program') : path.startsWith(href));
  const MOBILE_MAIN = ['/app', '/app/train', '/app/food', '/app/body'];
  const MOBILE_MORE = ITEMS.filter((it) => !MOBILE_MAIN.includes(it.href));
  const moreActive = MOBILE_MORE.some((it) => active(it.href));
  return (
    <div className="min-h-dvh md:grid md:grid-cols-[232px_1fr]">
      <aside className="hidden md:flex flex-col gap-1 p-4 sticky top-0 h-dvh border-r border-line">
        <Link href="/app" className="flex items-center gap-2.5 px-3 py-3 mb-4">
          <span className="w-8 h-8 rounded-xl grid place-items-center font-black text-sm text-white" style={{ background: 'linear-gradient(135deg, var(--accent-fat), var(--accent-body))' }}>R</span>
          <span className="font-bold tracking-tight">RECOMP</span>
        </Link>
        {ITEMS.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className={cx('flex items-center gap-3 px-3 h-11 rounded-[var(--radius-ctl)] text-sm font-medium transition-colors', active(href) ? 'bg-surface text-ink shadow-sm' : 'text-ink-2 hover:text-ink hover:bg-surface-2')}>
            <Icon size={18} style={active(href) ? { color: NAV_COLORS[href] } : undefined} /> {label}
          </Link>
        ))}
        <div className="mt-auto"><ThemeToggle labels className="w-full justify-start" /></div>
        <div className="px-3 text-[11px] text-ink-3 leading-relaxed">Pas un dispositif médical. Coaching général ; en cas de doute, consulte un professionnel.</div>
      </aside>
      <div className="md:hidden fixed top-3 right-3 z-40 glass rounded-[var(--radius-ctl)]"><ThemeToggle /></div>
      <main className="pb-24 md:pb-8">
        <div className="max-w-6xl mx-auto px-4 md:px-8 pt-5 md:pt-8">{children}</div>
      </main>
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 glass rounded-t-[22px] px-2 pt-2 pb-[max(8px,env(safe-area-inset-bottom))]">
        <div className="grid grid-cols-5">
          {ITEMS.filter((it) => MOBILE_MAIN.includes(it.href)).map(({ href, short, icon: Icon }) => (
            <Link key={href} href={href} onClick={() => setMore(false)} className={cx('flex flex-col items-center gap-1 py-1.5 rounded-xl text-[11px] font-medium', active(href) ? 'text-ink' : 'text-ink-3')}>
              <Icon size={20} strokeWidth={active(href) ? 2.4 : 1.8} style={active(href) ? { color: NAV_COLORS[href] } : undefined} /> {short}
            </Link>
          ))}
          <button type="button" onClick={() => setMore(!more)} aria-expanded={more} aria-controls="mobile-more" className={cx('flex flex-col items-center gap-1 py-1.5 rounded-xl text-[11px] font-medium', moreActive || more ? 'text-ink' : 'text-ink-3')}>
            {more ? <X size={20} /> : <MoreHorizontal size={20} strokeWidth={moreActive ? 2.4 : 1.8} />} Plus
          </button>
        </div>
        {more && (
          <div id="mobile-more" className="grid grid-cols-3 gap-2 px-2 pt-2 pb-1 rise">
            {MOBILE_MORE.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} onClick={() => setMore(false)} className={cx('card-2 flex flex-col items-center gap-1 py-3 text-[12px] font-medium', active(href) ? 'text-ink' : 'text-ink-2')}>
                <Icon size={20} style={{ color: NAV_COLORS[href] }} /> {label}
              </Link>
            ))}
          </div>
        )}
      </nav>
    </div>
  );
}
