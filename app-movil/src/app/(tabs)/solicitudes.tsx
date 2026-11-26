import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { CatalogoApi, SolicitudesApi } from '../../api/endpoints';
import type { Estado } from '../../api/types';
import { useAuth } from '../../context/auth';
import { usePaginated } from '../../utils/usePaginated';
import { Chips, Empty, ErrorView, Fab, Loading, styles } from '../../components/ui';
import { SolicitudItem } from '../../components/SolicitudItem';
import { colors, spacing } from '../../theme';

export default function SolicitudesScreen() {
  const { hasRole } = useAuth();
  const [estados, setEstados] = useState<Estado[]>([]);
  const [estadoId, setEstadoId] = useState<number | null>(null);
  const [soloMias, setSoloMias] = useState(false);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    CatalogoApi.estados().then(setEstados).catch(() => setEstados([]));
  }, []);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  const list = usePaginated(
    (page) =>
      SolicitudesApi.list({
        page,
        search: debounced,
        estado_id: estadoId ?? undefined,
        asignadas_a_mi: soloMias ? 1 : undefined,
      }),
    [debounced, estadoId, soloMias],
  );

  return (
    <View style={styles.screen}>
      <TextInput
        style={[styles.input, styles.search]}
        placeholder="Buscar por número, título o equipo"
        placeholderTextColor={colors.muted}
        value={search}
        onChangeText={setSearch}
      />
      <Chips options={estados.map((e) => ({ value: e.id, label: e.nombre }))} value={estadoId} onChange={setEstadoId} />
      {hasRole('tecnico') && (
        <Pressable onPress={() => setSoloMias((v) => !v)} style={[styles.row, { paddingHorizontal: spacing.lg, marginBottom: spacing.sm }]}>
          <View style={{ width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: colors.primary, backgroundColor: soloMias ? colors.primary : '#fff', marginRight: 8 }} />
          <Text style={{ color: colors.text }}>Solo asignadas a mí</Text>
        </Pressable>
      )}
      {list.loading ? (
        <Loading />
      ) : list.error && !list.items.length ? (
        <ErrorView message={list.error} onRetry={list.refresh} />
      ) : (
        <FlatList
          data={list.items}
          keyExtractor={(s) => String(s.id)}
          contentContainerStyle={[styles.content, { paddingTop: 0, paddingBottom: 96 }]}
          refreshControl={<RefreshControl refreshing={list.refreshing} onRefresh={list.refresh} />}
          onEndReached={list.loadMore}
          onEndReachedThreshold={0.4}
          ListHeaderComponent={<Text style={[styles.muted, { marginBottom: 8 }]}>{list.total} solicitud(es)</Text>}
          ListEmptyComponent={<Empty text="No hay solicitudes con estos filtros." />}
          ListFooterComponent={list.loadingMore ? <ActivityIndicator color={colors.primary} /> : undefined}
          renderItem={({ item }) => <SolicitudItem s={item} />}
        />
      )}
      <Fab label="Nueva solicitud" onPress={() => router.push('/solicitud/nueva')} />
    </View>
  );
}
