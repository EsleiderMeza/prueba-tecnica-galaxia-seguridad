import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { EquiposApi } from '../../api/endpoints';
import type { EstadoEquipo } from '../../api/types';
import { useAuth } from '../../context/auth';
import { usePaginated } from '../../utils/usePaginated';
import { Badge, Card, Chips, Empty, ErrorView, Fab, Loading, styles } from '../../components/ui';
import { colors } from '../../theme';
import { ESTADOS_EQUIPO, estadoEquipoInfo } from '../../utils/format';

export default function EquiposScreen() {
  const { hasRole } = useAuth();
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [estado, setEstado] = useState<EstadoEquipo | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  const list = usePaginated(
    (page) => EquiposApi.list({ page, search: debounced, estado: estado ?? undefined }),
    [debounced, estado],
  );

  return (
    <View style={styles.screen}>
      <TextInput
        style={[styles.input, styles.search]}
        placeholder="Buscar por código, nombre, serial o ubicación"
        placeholderTextColor={colors.muted}
        value={search}
        onChangeText={setSearch}
        autoCapitalize="none"
        clearButtonMode="while-editing"
      />
      <Chips options={ESTADOS_EQUIPO} value={estado} onChange={setEstado} />
      {list.loading ? (
        <Loading />
      ) : list.error && !list.items.length ? (
        <ErrorView message={list.error} onRetry={list.refresh} />
      ) : (
        <FlatList
          data={list.items}
          keyExtractor={(e) => String(e.id)}
          contentContainerStyle={[styles.content, { paddingTop: 0, paddingBottom: 96 }]}
          refreshControl={<RefreshControl refreshing={list.refreshing} onRefresh={list.refresh} />}
          onEndReached={list.loadMore}
          onEndReachedThreshold={0.4}
          ListHeaderComponent={<Text style={[styles.muted, { marginBottom: 8 }]}>{list.total} equipo(s)</Text>}
          ListEmptyComponent={<Empty text="No se encontraron equipos." />}
          ListFooterComponent={list.loadingMore ? <ActivityIndicator color={colors.primary} /> : undefined}
          renderItem={({ item }) => {
            const est = estadoEquipoInfo(item.estado);
            return (
              <Card onPress={() => router.push(`/equipo/${item.id}`)}>
                <View style={[styles.row, { justifyContent: 'space-between' }]}>
                  <Text style={{ color: colors.primary, fontWeight: '700' }}>{item.codigo_inventario}</Text>
                  <Badge label={est.label} color={est.color} />
                </View>
                <Text style={[styles.title, { marginTop: 4 }]}>{item.nombre}</Text>
                <Text style={styles.muted}>
                  {[item.categoria?.nombre, item.marca, item.modelo].filter(Boolean).join(' · ') || 'Sin detalles'}
                </Text>
                {!!item.ubicacion && <Text style={[styles.muted, { fontSize: 12, marginTop: 2 }]}>📍 {item.ubicacion}</Text>}
              </Card>
            );
          }}
        />
      )}
      {hasRole('admin', 'tecnico') && <Fab label="Registrar equipo" onPress={() => router.push('/equipo/form')} />}
    </View>
  );
}
