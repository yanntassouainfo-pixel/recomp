export const fmtDate = (iso: string) => new Date(iso + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
export const fmtDateLong = (iso: string) => new Date(iso + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
export const signed = (n: number, unit = '', d = 1) => `${n > 0 ? '+' : ''}${n.toFixed(d)}${unit}`;
export const cx = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(' ');
