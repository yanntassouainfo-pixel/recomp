import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { rulesCoach } from '@recomp/engine';
import { useComputed } from '@/store';
import { useTheme } from '@/theme';
import { Body, Button, Card, Screen } from '@/ui';

const SUGGESTIONS = ['Je mange quoi ce soir ?', 'J’ai raté ma séance', 'Je suis invité au restaurant', 'Je suis fatigué, je m’entraîne ?', 'Mon poids ne bouge plus'];

/** Hors-ligne : coach à règles. Avec backend : POST /api/coach (même contrat que le web). */
export default function Coach() {
  const t = useTheme();
  const { state, computed: c } = useComputed();
  const [q, setQ] = useState('');
  const [msgs, setMsgs] = useState<{ role: 'user' | 'assistant'; text: string }[]>([]);
  if (!state || !c) return null;
  const ask = (question: string) => {
    if (!question.trim()) return;
    const r = rulesCoach(question, state, c);
    setMsgs((m) => [...m, { role: 'user', text: question }, { role: 'assistant', text: r.text }]);
    setQ('');
  };
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Screen kicker="Coach" title="Que dois-je faire dans ma situation ?">
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 12 }}>
            {msgs.length === 0 && <Card><Body muted>Le coach connaît ton profil, tes 14 derniers jours et ton plan du jour.</Body>{SUGGESTIONS.map((s) => <Text key={s} onPress={() => ask(s)} style={{ color: t.ink, paddingVertical: 6, fontWeight: '600' }}>› {s}</Text>)}</Card>}
            {msgs.map((m, i) => (
              <View key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%', backgroundColor: m.role === 'user' ? t.ink : t.surface, borderRadius: 18, padding: 12, marginBottom: 8, borderWidth: m.role === 'user' ? 0 : 1, borderColor: t.line }}>
                <Text style={{ color: m.role === 'user' ? t.bg : t.ink, fontSize: 15, lineHeight: 21 }}>{m.text}</Text>
              </View>
            ))}
          </ScrollView>
          <View style={{ flexDirection: 'row', gap: 8, paddingBottom: 12 }}>
            <TextInput value={q} onChangeText={setQ} placeholder="Pose ta question…" placeholderTextColor={t.ink3} style={{ flex: 1, height: 46, borderRadius: 14, backgroundColor: t.surface2, color: t.ink, paddingHorizontal: 14 }} onSubmitEditing={() => ask(q)} />
            <View style={{ width: 100 }}><Button label="Envoyer" onPress={() => ask(q)} /></View>
          </View>
        </Screen>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
