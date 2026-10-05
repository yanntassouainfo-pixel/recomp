import type { Metadata, Viewport } from 'next';
import { Manrope } from 'next/font/google';
import './globals.css';
import { THEME_INIT_SCRIPT } from '@/components/ui/ThemeToggle';

const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope', weight: ['400', '500', '600', '700', '800'] });

export const metadata: Metadata = {
  title: 'RECOMP — Coach de recomposition corporelle',
  description: 'Perdre du gras, construire du muscle, gagner en vitalité. Sans transformer ta vie en prison.',
};

export const viewport: Viewport = { themeColor: '#f5f4f0', width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={manrope.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
