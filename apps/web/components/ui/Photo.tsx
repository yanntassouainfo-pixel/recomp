import type { Photo } from '@recomp/engine';
import { cx } from '@/lib/format';

/** Image éditoriale avec crédit discret (Unsplash : attribution + lien utm). */
export function PhotoFrame({ photo, className, ratio = '4/3', priority, overlay, children, sizes }: { photo: Photo; className?: string; ratio?: string; priority?: boolean; overlay?: boolean; children?: React.ReactNode; sizes?: string }) {
  return (
    <figure className={cx('relative overflow-hidden rounded-[var(--radius-card)] bg-surface-2', className)} style={{ aspectRatio: ratio }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo.url} alt={photo.alt} loading={priority ? 'eager' : 'lazy'} decoding="async" sizes={sizes} className="absolute inset-0 w-full h-full object-cover" style={{ filter: 'saturate(0.88) contrast(0.98)' }} />
      {overlay && <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, color-mix(in srgb, var(--bg) 85%, transparent) 0%, transparent 55%)' }} />}
      {children}
      <figcaption className="absolute bottom-2 right-3 text-[10px] text-white/80 mix-blend-luminosity"><a href={photo.creditUrl} target="_blank" rel="noreferrer" className="hover:underline">Photo : {photo.credit} / Unsplash</a></figcaption>
    </figure>
  );
}
