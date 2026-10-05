import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useComputed } from '@/store';
import { ACCENT, useTheme } from '@/theme';
import { Big, Body, Card, Pill, Screen } from '@/ui';

export default function BodyScreen() {
  const t = useTheme();
  const { state, computed: c } = useComputed();
  if (!state || !c) return null;
  const waist = c.series.waist;
  const w = c.series.weightRolling;
  const str = c.series.strength;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <Screen kicker="Transformation" title="Est-ce que je progresse ?" subtitle={c.bcs.headline}>
          <Card accent={ACCENT.fat} kicker="Body Composition Score" title={`${c.bcs.score}/100`}>
            {c.bcs.drivers.map((d) => <Body key={d.key} muted>{d.label} · {d.signal > 0.2 ? 'favorable' : d.signal < -0.2 ? 'défavorable' : 'neutre'} — {d.text}</Body>)}
          </Card>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Card style={{ flex: 1 }} kicker="Tour de taille"><Big value={waist.length ? waist[waist.length - 1]!.value : '—'} unit="cm" /></Card>
            <Card style={{ flex: 1 }} kicker="Poids 7 j"><Big value={w.length ? w[w.length - 1]!.value.toFixed(1) : '—'} unit="kg" /></Card>
          </View>
          <Card accent={ACCENT.muscle} kicker="Force" title={`Indice ${str.length ? str[str.length - 1]!.value.toFixed(0) : '—'} (100 au départ)`}><Body muted>Si l’indice monte, le muscle est au minimum préservé.</Body></Card>
          <Card kicker="Bilan" title={c.review.headline}>
            {c.review.keep[0] && <Body>Ce qu’on ne change pas : {c.review.keep[0].text}</Body>}
            {c.review.change[0] && <Body>Ce qu’on change : {c.review.change[0].text}</Body>}
            <Pill>{c.plateau.kind === 'progressing' ? 'Pas de plateau' : c.plateau.kind}</Pill>
          </Card>
        </Screen>
      </ScrollView>
    </SafeAreaView>
  );
}
