import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../../context/auth';
import { DashboardApi } from '../../api/endpoints';
import { useApi } from '../../utils/useApi';
import { Card, Empty, ErrorView, Loading, SectionTitle, styles } from '../../components/ui';
import { SolicitudItem } from '../../components/SolicitudItem';
import { colors, spacing } from '../../theme';

function Stat({ label, value, icon, onPress }: { label: string; value: number; icon: keyof typeof Ionicons.glyphMap; onPress?: () => void }) {
  return (
    <Card style={{ flex: 1, marginHorizontal: 4 }} onPress={onPress}>
      <Ionicons name={icon} size={22} color={colors.primary} />
      <Text style={{ fontSize: 26, fontWeight: '800', color: colors.text, marginTop: 6 }}>{value}</Text>
      <Text style={styles.muted}>{label}</Text>
    </Card>
  );
}

function Accion({ label, icon, onPress }: { label: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ alignItems: 'center', flex: 1, opacity: pressed ? 0.6 : 1 }]}>
      <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={24} color="#fff" />
      </View>
      <Text style={{ fontSize: 12, color: colors.text, marginTop: 6, textAlign: 'center' }}>{label}</Text>
    </Pressable>
  );
}

export default function PanelScreen() {
  const { user, logout, hasRole } = useAuth();
  const { data, error, loading, refreshing, reload } = useApi(() => DashboardApi.get(), []);
  const puedeGestionarEquipos = hasRole('admin', 'tecnico');

  return (
    <>
      <Tabs.Screen
        options={{
          headerRight: () => (
            <Pressable onPress={logout} style={{ paddingHorizontal: spacing.lg }} accessibilityLabel="Cerrar sesión">
              <Ionicons name="log-out-outline" size={24} color="#fff" />
            </Pressable>
          ),
        }}
      />
      {loading ? (
        <Loading />
      ) : error && !data ? (
        <ErrorView message={error} onRetry={reload} />
      ) : (
        <ScrollView style={styles.screen} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={reload} />}>
          <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text }}>Hola, {user?.nombre?.split(' ')[0]}</Text>
          <Text style={[styles.muted, { marginBottom: spacing.lg }]}>{user?.rol.nombre}</Text>

          <View style={{ flexDirection: 'row', marginHorizontal: -4 }}>
            <Stat label="Equipos" value={data?.equipos_total ?? 0} icon="desktop-outline" onPress={() => router.push('/equipos')} />
            <Stat label="Abiertas" value={data?.solicitudes_abiertas ?? 0} icon="alert-circle-outline" onPress={() => router.push('/solicitudes')} />
          </View>
          <View style={{ flexDirection: 'row', marginHorizontal: -4 }}>
            <Stat label="Solicitudes" value={data?.solicitudes_total ?? 0} icon="documents-outline" onPress={() => router.push('/solicitudes')} />
            <Stat
              label={hasRole('tecnico') ? 'Asignadas a mí' : 'Asignadas'}
              value={data?.mis_asignadas ?? 0}
              icon="person-outline"
              onPress={() => router.push('/solicitudes')}
            />
          </View>

          <SectionTitle>Acciones rápidas</SectionTitle>
          <Card style={{ flexDirection: 'row' }}>
            <Accion label="Nueva solicitud" icon="add" onPress={() => router.push('/solicitud/nueva')} />
            {puedeGestionarEquipos && <Accion label="Registrar equipo" icon="desktop" onPress={() => router.push('/equipo/form')} />}
            <Accion label="Inventario" icon="cube" onPress={() => router.push('/inventario')} />
            <Accion label="Historial" icon="time" onPress={() => router.push('/historial')} />
          </Card>

          {!!data?.por_estado?.length && (
            <>
              <SectionTitle>Solicitudes por estado</SectionTitle>
              <Card>
                {data.por_estado.map((e) => {
                  const max = Math.max(1, ...data.por_estado.map((x) => x.total));
                  return (
                    <View key={e.id} style={{ marginBottom: spacing.sm }}>
                      <View style={[styles.row, { justifyContent: 'space-between' }]}>
                        <Text style={{ color: colors.text }}>{e.nombre}</Text>
                        <Text style={{ color: colors.text, fontWeight: '700' }}>{e.total}</Text>
                      </View>
                      <View style={{ height: 8, backgroundColor: colors.bg, borderRadius: 4, marginTop: 4 }}>
                        <View style={{ height: 8, width: `${(e.total / max) * 100}%`, backgroundColor: e.color || colors.primary, borderRadius: 4 }} />
                      </View>
                    </View>
                  );
                })}
              </Card>
            </>
          )}

          <SectionTitle>Solicitudes recientes</SectionTitle>
          {data?.recientes?.length ? data.recientes.map((s) => <SolicitudItem key={s.id} s={s} />) : <Empty text="Aún no hay solicitudes." />}
        </ScrollView>
      )}
    </>
  );
}
