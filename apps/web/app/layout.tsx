import type { Metadata, Viewport } from 'next';
import { Manrope } from 'next/font/google';
import './globals.css';
import { THEME_INIT_SCRIPT } from '@/components/ui/ThemeToggle';

const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope', weight: ['400', '500', '600', '700', '800'] });

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://yanntassouainfo-pixel.github.io/recomp';

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: 'RECOMP — Coach de recomposition corporelle',
  description: 'Coach de recomposition corporelle. Moins de gras, plus de muscle, à poids comparable — sans régime, avec ta cuisine (Afrique de l’Ouest incluse).',
  icons: { icon: [{ url: 'favicon.svg', type: 'image/svg+xml' }] },
  openGraph: { title: 'RECOMP — Devenir meilleur à poids comparable', description: 'Un coach qui mesure ce que la balance ne voit pas, s’adapte à ta vie, et connaît ta cuisine.', images: [{ url: 'og.svg', width: 1200, height: 630 }], locale: 'fr_FR', type: 'website' },
  twitter: { card: 'summary_large_image', title: 'RECOMP — Devenir meilleur à poids comparable', description: 'Moins de gras, plus de muscle, à poids comparable. Sans régime.', images: ['og.svg'] },
};

export const viewport: Viewport = { themeColor: [{ media: '(prefers-color-scheme: light)', color: '#f5f4f0' }, { media: '(prefers-color-scheme: dark)', color: '#0e1012' }], width: 'device-width', initialScale: 1, viewportFit: 'cover' };

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
