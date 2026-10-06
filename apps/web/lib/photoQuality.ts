/** Contrôle qualité d'une photo sur l'appareil (sans IA) : luminosité, contraste, format, résolution. */
export interface LocalPhotoCheck {
  brightness: number; // 0-255
  contrast: number; // écart-type 0-128
  width: number;
  height: number;
  portrait: boolean;
  verdicts: { key: 'lighting' | 'contrast' | 'orientation' | 'resolution'; level: 'good' | 'ok' | 'poor'; text: string }[];
}

export async function checkPhotoQuality(dataUrl: string): Promise<LocalPhotoCheck> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => { const i = new Image(); i.onload = () => resolve(i); i.onerror = reject; i.src = dataUrl; });
  const w = 160, h = Math.max(1, Math.round((img.height / img.width) * 160));
  const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d')!; ctx.drawImage(img, 0, 0, w, h);
  const { data } = ctx.getImageData(0, 0, w, h);
  let sum = 0, sumSq = 0; const n = w * h;
  for (let i = 0; i < data.length; i += 4) { const l = 0.299 * data[i]! + 0.587 * data[i + 1]! + 0.114 * data[i + 2]!; sum += l; sumSq += l * l; }
  const mean = sum / n; const sd = Math.sqrt(Math.max(0, sumSq / n - mean * mean));
  const portrait = img.height > img.width;
  const verdicts: LocalPhotoCheck['verdicts'] = [
    { key: 'lighting', level: mean < 60 ? 'poor' : mean > 200 ? 'poor' : mean < 90 || mean > 170 ? 'ok' : 'good', text: mean < 60 ? 'Photo sombre : rapproche-toi d’une fenêtre, lumière de face.' : mean > 200 ? 'Photo surexposée : évite le contre-jour direct.' : 'Luminosité correcte.' },
    { key: 'contrast', level: sd < 25 ? 'poor' : sd < 40 ? 'ok' : 'good', text: sd < 25 ? 'Peu de contraste : les reliefs se liront mal. Lumière légèrement latérale, fond uni.' : 'Contraste suffisant pour lire les reliefs.' },
    { key: 'orientation', level: portrait ? 'good' : 'ok', text: portrait ? 'Format portrait, corps entier visible : bien.' : 'Format paysage : préfère le portrait pour le corps entier.' },
    { key: 'resolution', level: img.width >= 900 ? 'good' : img.width >= 600 ? 'ok' : 'poor', text: img.width >= 900 ? 'Résolution suffisante.' : 'Résolution faible : les détails seront limités.' },
  ];
  return { brightness: Math.round(mean), contrast: Math.round(sd), width: img.width, height: img.height, portrait, verdicts };
}

export function dataUrlToBase64(dataUrl: string): { data: string; mediaType: 'image/jpeg' | 'image/png' | 'image/webp' } | null {
  const m = dataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/);
  if (!m) return null;
  return { data: m[2]!, mediaType: m[1] as 'image/jpeg' | 'image/png' | 'image/webp' };
}
