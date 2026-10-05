'use client';
import { useEffect, useState } from 'react';
import { Moon, Sun, MonitorSmartphone } from 'lucide-react';
import { cx } from '@/lib/format';

type Theme = 'light' | 'dark' | 'system';
const KEY = 'recomp-theme';

export function applyTheme(t: Theme) {
  const root = document.documentElement;
  if (t === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', t);
  const dark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0e1012' : '#f5f4f0');
}

/** Bouton clair / sombre / auto. Le choix est mémorisé dans le navigateur. */
export function ThemeToggle({ className, labels }: { className?: string; labels?: boolean }) {
  const [theme, setTheme] = useState<Theme>('system');
  useEffect(() => {
    try { const s = localStorage.getItem(KEY) as Theme | null; if (s === 'light' || s === 'dark') setTheme(s); } catch { /* privé */ }
  }, []);
  const next: Record<Theme, Theme> = { system: 'light', light: 'dark', dark: 'system' };
  const Icon = theme === 'light' ? Sun : theme === 'dark' ? Moon : MonitorSmartphone;
  const label = theme === 'light' ? 'Clair' : theme === 'dark' ? 'Sombre' : 'Auto';
  const change = () => {
    setTheme((prev) => {
      const t = next[prev];
      try { if (t === 'system') localStorage.removeItem(KEY); else localStorage.setItem(KEY, t); } catch { /* privé */ }
      applyTheme(t);
      return t;
    });
  };
  return (
    <button type="button" onClick={change} title={`Thème : ${label} (cliquer pour changer)`} aria-label={`Thème ${label}`} className={cx('inline-flex items-center gap-2 h-10 px-3 rounded-[var(--radius-ctl)] text-sm font-medium text-ink-2 hover:text-ink hover:bg-surface-2 transition-colors', className)}>
      <Icon size={17} />
      {labels && <span>{label}</span>}
    </button>
  );
}

/** Script inline exécuté avant le rendu pour éviter le flash de thème. */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('${KEY}');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`;
