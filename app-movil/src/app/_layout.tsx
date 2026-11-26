import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../context/auth';
import { Loading } from '../components/ui';
import { colors } from '../theme';

function RootNavigator() {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: colors.bg },
        headerBackTitle: 'Atrás',
      }}
    >
      <Stack.Protected guard={!user}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={!!user}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="equipo/[id]" options={{ title: 'Detalle del equipo' }} />
        <Stack.Screen name="equipo/form" options={{ title: 'Equipo' }} />
        <Stack.Screen name="solicitud/[id]" options={{ title: 'Solicitud' }} />
        <Stack.Screen name="solicitud/nueva" options={{ title: 'Nueva solicitud' }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <RootNavigator />
    </AuthProvider>
  );
}
