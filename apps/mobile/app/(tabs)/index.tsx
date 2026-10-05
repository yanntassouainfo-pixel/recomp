import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useComputed, useStore } from '@/store';
import { ACCENT, useTheme } from '@/theme';
import { Big, Body, Button, Card, Pill, Screen } from '@/ui';

export default function Home() {
  const t = useTheme();
  const { state, computed: c } = useComputed();
  const loadDemo = useStore((s) => s.loadDemo);
  if (!state || !c) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
        <Screen kicker="RECOMP" title="Devenir meilleur à poids comparable." subtitle="Perdre du gras, construire du muscle, gagner en vitalité. Sans transformer ta vie en prison.">
          <Button label="Explorer avec le profil démo" onPress={loadDemo} />
          <Text style={{ color: t.ink3, fontSize: 12, marginTop: 10 }}>L’onboarding complet est disponible sur la version web ; la synchronisation de compte arrive en V1.1.</Text>
        </Screen>
      </SafeAreaView>
    );
  }
  const waist = c.series.waist;
  const w = c.series.weightRolling;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <Screen kicker={c.brief.date} title={`${c.brief.greeting} ${c.brief.dayType === 'training' ? 'Jour d’entraînement.' : 'Jour de repos.'}`} subtitle={c.bcs.headline}>
          {c.alerts.slice(0, 1).map((a) => <Card key={a.id} style={{ backgroundColor: t.surface2, borderWidth: 0 }}><Body>{a.text}</Body></Card>)}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Card style={{ flex: 1 }} kicker="Body score"><Big value={c.bcs.score} unit="/100" /><Pill color={ACCENT.fat}>{c.bcs.trend === 'improving' ? 'en amélioration' : c.bcs.trend}</Pill></Card>
            <Card style={{ flex: 1 }} kicker="Tour de taille"><Big value={waist.length ? waist[waist.length - 1]!.value : '—'} unit="cm" /><Pill color={ACCENT.fat}>{waist.length > 1 ? `${(waist[waist.length - 1]!.value - waist[0]!.value).toFixed(1)} cm` : '—'}</Pill></Card>
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Card style={{ flex: 1 }} kicker="Poids 7 j"><Big value={w.length ? w[w.length - 1]!.value.toFixed(1) : '—'} unit="kg" /></Card>
            <Card style={{ flex: 1 }} kicker="Vitalité"><Big value={c.vitality.score} unit="/10" /></Card>
          </View>
          <Card accent={ACCENT.consistency} kicker="Ton plan du jour" title="Les 3 choses qui comptent">
            {c.brief.topThree.map((x, i) => <Body key={x}>{i + 1}. {x}</Body>)}
          </Card>
          {c.brief.emphasis.map((k) => (
            k === 'workout' && c.session ? <Card key={k} accent={ACCENT.muscle} kicker="Entraînement" title={c.session.title}><Body muted>{c.session.message}</Body>{c.session.exercises.slice(0, 5).map((e) => <Body key={e.exerciseId}>{e.name} · {e.sets}×{e.repMin}–{e.repMax}</Body>)}</Card>
            : k === 'nutrition' ? <Card key={k} accent={ACCENT.nutrition} kicker="Nutrition" title={state.profile.nutritionPrecision === 'simple' ? `${c.nutrition.simple.proteinPalms} paumes de protéines` : `${c.nutrition.proteinG} g de protéines · ${c.nutrition.kcal} kcal`}><Body muted>{c.nutrition.strategy}</Body></Card>
            : k === 'recovery' ? <Card key={k} accent={ACCENT.recovery} kicker="Récupération" title={`${c.recovery.score}/100`}><Body muted>{c.recovery.suggestion}</Body></Card>
            : k === 'sleep' ? <Card key={k} accent={ACCENT.vitality} kicker="Sommeil" title="Coucher avant 23 h 30"><Body muted>Sous 6,5 h, la faim monte et la perte se déplace vers le muscle.</Body></Card>
            : <Card key={k} accent={ACCENT.consistency} kicker="Mouvement" title={c.brief.lines.find((l) => l.label === 'Mouvement')?.value ?? ''}><Body muted>+1 000 pas par rapport à ton habitude. Pas de 10 000 par défaut.</Body></Card>
          ))}
        </Screen>
      </ScrollView>
    </SafeAreaView>
  );
}
