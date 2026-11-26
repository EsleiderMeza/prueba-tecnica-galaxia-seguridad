import { ActivityIndicator, FlatList, Pressable, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { HistorialApi } from '../../api/endpoints';
import { usePaginated } from '../../utils/usePaginated';
import { Empty, ErrorView, Loading, styles } from '../../components/ui';
import { HistorialItem } from '../../components/HistorialItem';
import { colors, spacing } from '../../theme';

/** Historial global de atención: todos los movimientos de las solicitudes visibles para el usuario. */
export default function HistorialScreen() {
  const list = usePaginated((page) => HistorialApi.list({ page }), []);

  if (list.loading) return <Loading />;
  if (list.error && !list.items.length) return <ErrorView message={list.error} onRetry={list.refresh} />;

  return (
    <FlatList
      style={styles.screen}
      data={list.items}
      keyExtractor={(h) => String(h.id)}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={list.refreshing} onRefresh={list.refresh} />}
      onEndReached={list.loadMore}
      onEndReachedThreshold={0.4}
      ListEmptyComponent={<Empty text="Todavía no hay movimientos." />}
      ListFooterComponent={list.loadingMore ? <ActivityIndicator color={colors.primary} /> : undefined}
      renderItem={({ item, index }) => (
        <Pressable
          onPress={() => router.push(`/solicitud/${item.solicitud_id}`)}
          style={({ pressed }) => ({ backgroundColor: pressed ? colors.bg : colors.card, paddingHorizontal: spacing.md, paddingTop: spacing.md })}
        >
          <HistorialItem h={item} showSolicitud last={index === list.items.length - 1} />
        </Pressable>
      )}
    />
  );
}
