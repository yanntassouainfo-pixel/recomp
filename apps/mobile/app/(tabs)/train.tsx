import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useComputed, useStore, today } from '@/store';
import { ACCENT, useTheme } from '@/theme';
import { Body, Button, Card, Pill, Screen } from '@/ui';

export default function Train() {
  const t = useTheme();
  const { state, computed: c } = useComputed();
  const upsertSession = useStore((s) => s.upsertSession);
  if (!state || !c) return null;
  const s = c.session;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <Screen kicker="Entraînement" title={s ? s.title : 'Jour de repos'} subtitle={s ? s.message : 'Marche, mobilité, et un vrai dîner.'}>
          {s && !s.replacedByRecovery && s.exercises.map((e, i) => {
            const nt = c.targetsByExercise[e.exerciseId];
            return (
              <Card key={e.exerciseId} accent={ACCENT.muscle} kicker={`Exercice ${i + 1}`} title={e.name}>
                <Pill>{e.sets} × {e.repMin}–{e.repMax} · RIR {e.rirTarget} · repos {e.restSec} s</Pill>
                {nt && <Body muted>{nt.weightKg !== null ? `${nt.weightKg} kg · ` : ''}{nt.message}</Body>}
              </Card>
            );
          })}
          {s && !s.replacedByRecovery && c.todayWorkout && <Button label="Marquer la séance comme faite" onPress={() => upsertSession({ id: 'sess_' + today(), date: today(), workoutDayId: c.todayWorkout!.id, planned: true, completed: true, readiness: c.recovery.readiness })} />}
          {s?.replacedByRecovery && <Card accent={ACCENT.recovery} title="Récupération active"><Body>{s.message}</Body></Card>}
        </Screen>
      </ScrollView>
    </SafeAreaView>
  );
}
