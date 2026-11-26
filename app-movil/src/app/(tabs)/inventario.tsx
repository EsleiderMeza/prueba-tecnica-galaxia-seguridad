import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { InventarioApi } from '../../api/endpoints';
import { useApi } from '../../utils/useApi';
import { Card, Empty, ErrorView, Loading, SectionTitle, styles } from '../../components/ui';
import { colors, spacing } from '../../theme';
import { estadoEquipoInfo } from '../../utils/format';

function Barras({ filas }: { filas: { key: string; label: string; total: number; color?: string }[] }) {
  if (!filas.length) return <Empty text="Sin datos." />;
  const max = Math.max(1, ...filas.map((f) => f.total));
  return (
    <>
      {filas.map((f) => (
        <View key={f.key} style={{ marginBottom: spacing.md }}>
          <View style={[styles.row, { justifyContent: 'space-between' }]}>
            <Text style={{ color: colors.text, flex: 1 }} numberOfLines={1}>{f.label}</Text>
            <Text style={{ color: colors.text, fontWeight: '700' }}>{f.total}</Text>
          </View>
          <View style={{ height: 8, backgroundColor: colors.bg, borderRadius: 4, marginTop: 4 }}>
            <View style={{ height: 8, width: `${(f.total / max) * 100}%`, backgroundColor: f.color ?? colors.primary, borderRadius: 4 }} />
          </View>
        </View>
      ))}
    </>
  );
}

export default function InventarioScreen() {
  const { data, error, loading, refreshing, reload } = useApi(() => InventarioApi.get(), []);

  if (loading) return <Loading />;
  if (error && !data) return <ErrorView message={error} onRetry={reload} />;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={reload} />}>
      <Card style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: 40, fontWeight: '800', color: colors.primary }}>{data?.total ?? 0}</Text>
        <Text style={styles.muted}>equipos registrados</Text>
      </Card>

      <SectionTitle>Por estado</SectionTitle>
      <Card>
        <Barras
          filas={(data?.por_estado ?? []).map((e) => {
            const info = estadoEquipoInfo(e.estado);
            return { key: e.estado, label: info.label, total: e.total, color: info.color };
          })}
        />
      </Card>

      <SectionTitle>Por categoría</SectionTitle>
      <Card>
        <Barras filas={(data?.por_categoria ?? []).map((c) => ({ key: String(c.id), label: c.nombre, total: c.total }))} />
      </Card>

      <SectionTitle>Por ubicación</SectionTitle>
      <Card>
        <Barras filas={(data?.por_ubicacion ?? []).map((u) => ({ key: u.ubicacion, label: u.ubicacion || 'Sin ubicación', total: u.total, color: colors.accent }))} />
      </Card>
    </ScrollView>
  );
}
