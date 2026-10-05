import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useComputed } from '@/store';
import { ACCENT, useTheme } from '@/theme';
import { Big, Body, Card, Pill, Screen } from '@/ui';

export default function Food() {
  const t = useTheme();
  const { state, computed: c } = useComputed();
  if (!state || !c) return null;
  const simple = state.profile.nutritionPrecision === 'simple';
  const n = c.nutrition;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <Screen kicker={`Nutrition · ${c.brief.dayType === 'training' ? 'jour d’entraînement' : 'jour de repos'}`} title="Qu’est-ce que je mange ?" subtitle={n.strategy}>
          <Card accent={ACCENT.nutrition} kicker="Cibles du jour" title={simple ? 'En portions-main' : `${n.kcal} kcal`}>
            {simple ? (
              <Body>{n.simple.proteinPalms} paumes de protéines · {n.simple.vegFists} poings de légumes · {n.simple.carbFists} poings de glucides · {n.simple.fatThumbs} pouces de graisses</Body>
            ) : (
              <Body>P {n.proteinG} g · G {n.carbsG} g · L {n.fatG} g · fibres {n.fiberG} g</Body>
            )}
            <Body muted>{c.dayPlan.hydration}</Body>
            <Pill color={ACCENT.vitality}>Preuve : solide (protéines)</Pill>
          </Card>
          {c.dayPlan.meals.map((m) => (
            <Card key={m.id} kicker={m.timing} title={m.name}>
              {simple ? <Body>{m.simple}</Body> : m.items.map((it) => <Body key={it.foodId}>{it.name} · {it.grams} g</Body>)}
              {m.tip && <Body muted>{m.tip}</Body>}
            </Card>
          ))}
        </Screen>
      </ScrollView>
    </SafeAreaView>
  );
}
