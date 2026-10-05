import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/theme';

const ICONS = { index: 'home', train: 'activity', food: 'coffee', body: 'maximize', coach: 'message-circle' } as const;

export default function TabsLayout() {
  const t = useTheme();
  return (
    <Tabs screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: t.ink,
      tabBarInactiveTintColor: t.ink3,
      tabBarStyle: { backgroundColor: t.surface, borderTopColor: t.line, height: 84, paddingTop: 8 },
      tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      tabBarIcon: ({ color, size }) => <Feather name={ICONS[route.name as keyof typeof ICONS] ?? 'circle'} size={size} color={color} />,
    })}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="train" options={{ title: 'Train' }} />
      <Tabs.Screen name="food" options={{ title: 'Food' }} />
      <Tabs.Screen name="body" options={{ title: 'Body' }} />
      <Tabs.Screen name="coach" options={{ title: 'Coach' }} />
    </Tabs>
  );
}
