import { Pressable, Text, View, type ViewProps } from 'react-native';
import { useTheme } from './theme';

export function Screen({ children, title, kicker, subtitle }: { children: React.ReactNode; title: string; kicker?: string; subtitle?: string }) {
  const t = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingHorizontal: 16, paddingTop: 12 }}>
      {kicker && <Text style={{ color: t.ink3, fontSize: 12, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' }}>{kicker}</Text>}
      <Text style={{ color: t.ink, fontSize: 28, fontWeight: '800', letterSpacing: -0.5, marginTop: 4 }}>{title}</Text>
      {subtitle && <Text style={{ color: t.ink2, fontSize: 15, marginTop: 6, marginBottom: 8 }}>{subtitle}</Text>}
      {children}
    </View>
  );
}

export function Card({ children, accent, title, kicker, style, ...rest }: ViewProps & { accent?: string; title?: string; kicker?: string }) {
  const t = useTheme();
  return (
    <View style={[{ backgroundColor: t.surface, borderRadius: 24, padding: 18, borderWidth: 1, borderColor: t.line, marginBottom: 12, gap: 10 }, style]} {...rest}>
      {(title || kicker) && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {accent && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: accent }} />}
          <View>
            {kicker && <Text style={{ color: t.ink3, fontSize: 11, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' }}>{kicker}</Text>}
            {title && <Text style={{ color: t.ink, fontSize: 15, fontWeight: '700' }}>{title}</Text>}
          </View>
        </View>
      )}
      {children}
    </View>
  );
}

export function Body({ children, muted }: { children: React.ReactNode; muted?: boolean }) {
  const t = useTheme();
  return <Text style={{ color: muted ? t.ink2 : t.ink, fontSize: 14, lineHeight: 20 }}>{children}</Text>;
}

export function Big({ value, unit, label }: { value: string | number; unit?: string; label?: string }) {
  const t = useTheme();
  return (
    <View>
      {label && <Text style={{ color: t.ink3, fontSize: 11, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' }}>{label}</Text>}
      <Text style={{ color: t.ink, fontSize: 30, fontWeight: '800', fontVariant: ['tabular-nums'] }}>{value}<Text style={{ fontSize: 15, color: t.ink2, fontWeight: '500' }}> {unit}</Text></Text>
    </View>
  );
}

export function Button({ label, onPress, secondary }: { label: string; onPress: () => void; secondary?: boolean }) {
  const t = useTheme();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: secondary ? t.surface2 : t.ink, opacity: pressed ? 0.85 : 1 })}>
      <Text style={{ color: secondary ? t.ink : t.bg, fontWeight: '700' }}>{label}</Text>
    </Pressable>
  );
}

export function Pill({ children, color }: { children: React.ReactNode; color?: string }) {
  const t = useTheme();
  return <View style={{ alignSelf: 'flex-start', paddingHorizontal: 10, height: 26, borderRadius: 99, backgroundColor: color ? color + '26' : t.surface2, justifyContent: 'center' }}><Text style={{ color: color ?? t.ink2, fontSize: 12, fontWeight: '600' }}>{children}</Text></View>;
}
