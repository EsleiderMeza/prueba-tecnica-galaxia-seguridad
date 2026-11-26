import { Tabs } from 'expo-router/js-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { ColorValue } from 'react-native';
import { colors } from '../../theme';

type IconName = keyof typeof Ionicons.glyphMap;
function icon(name: IconName) {
  function TabIcon({ color, size }: { color: ColorValue; size: number }) {
    return <Ionicons name={name} color={color as string} size={size} />;
  }
  return TabIcon;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Panel', tabBarIcon: icon('grid-outline') }} />
      <Tabs.Screen name="equipos" options={{ title: 'Equipos', tabBarIcon: icon('desktop-outline') }} />
      <Tabs.Screen name="solicitudes" options={{ title: 'Solicitudes', tabBarIcon: icon('construct-outline') }} />
      <Tabs.Screen name="inventario" options={{ title: 'Inventario', tabBarIcon: icon('cube-outline') }} />
      <Tabs.Screen name="historial" options={{ title: 'Historial', tabBarIcon: icon('time-outline') }} />
    </Tabs>
  );
}
