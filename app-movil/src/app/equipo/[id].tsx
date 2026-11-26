import { Alert, Platform, RefreshControl, ScrollView, Text } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { EquiposApi } from '../../api/endpoints';
import { errorMessage } from '../../api/client';
import { useAuth } from '../../context/auth';
import { useApi } from '../../utils/useApi';
import { Badge, Button, Card, Empty, ErrorView, InfoRow, Loading, SectionTitle, styles } from '../../components/ui';
import { SolicitudItem } from '../../components/SolicitudItem';
import { estadoEquipoInfo, fecha } from '../../utils/format';

function confirmar(titulo: string, mensaje: string): Promise<boolean> {
  if (Platform.OS === 'web') return Promise.resolve(globalThis.confirm?.(`${titulo}\n\n${mensaje}`) ?? false);
  return new Promise((resolve) =>
    Alert.alert(titulo, mensaje, [
      { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
      { text: 'Eliminar', style: 'destructive', onPress: () => resolve(true) },
    ]),
  );
}

export default function EquipoDetalle() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const equipoId = Number(id);
  const { hasRole } = useAuth();
  const { data: e, error, loading, refreshing, reload } = useApi(() => EquiposApi.get(equipoId), [equipoId]);
  const [deleting, setDeleting] = useState(false);

  if (loading) return <Loading />;
  if (error || !e) return <ErrorView message={error ?? 'Equipo no encontrado'} onRetry={reload} />;

  const est = estadoEquipoInfo(e.estado);

  const eliminar = async () => {
    if (!(await confirmar('Eliminar equipo', `¿Eliminar ${e.codigo_inventario}? Esta acción no se puede deshacer.`))) return;
    setDeleting(true);
    try {
      await EquiposApi.remove(e.id);
      router.back();
    } catch (err) {
      Alert.alert('No se pudo eliminar', errorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={reload} />}>
      <Stack.Screen options={{ title: e.codigo_inventario }} />
      <Card>
        <Text style={[styles.title, { fontSize: 20 }]}>{e.nombre}</Text>
        <Badge label={est.label} color={est.color} />
        <InfoRow label="Código de inventario" value={e.codigo_inventario} />
        <InfoRow label="Categoría" value={e.categoria?.nombre} />
        <InfoRow label="Marca" value={e.marca} />
        <InfoRow label="Modelo" value={e.modelo} />
        <InfoRow label="Serial" value={e.serial} />
        <InfoRow label="Ubicación" value={e.ubicacion} />
        <InfoRow label="Responsable" value={e.responsable} />
        <InfoRow label="Fecha de adquisición" value={fecha(e.fecha_adquisicion)} />
        {!!e.observaciones && <Text style={[styles.muted, { marginTop: 8 }]}>{e.observaciones}</Text>}
      </Card>

      <Button title="Reportar falla de este equipo" icon="construct" onPress={() => router.push({ pathname: '/solicitud/nueva', params: { equipo_id: String(e.id) } })} />
      {hasRole('admin', 'tecnico') && (
        <Button title="Editar equipo" icon="create-outline" variant="secondary" onPress={() => router.push({ pathname: '/equipo/form', params: { id: String(e.id) } })} />
      )}
      {hasRole('admin') && <Button title="Eliminar equipo" icon="trash-outline" variant="danger" loading={deleting} onPress={eliminar} />}

      <SectionTitle>Historial de atención del equipo</SectionTitle>
      {e.solicitudes?.length ? e.solicitudes.map((s) => <SolicitudItem key={s.id} s={s} />) : <Empty text="Este equipo no tiene solicitudes de soporte." />}
    </ScrollView>
  );
}
