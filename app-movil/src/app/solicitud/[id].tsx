import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, Text, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { CatalogoApi, SolicitudesApi } from '../../api/endpoints';
import { ApiError, errorMessage } from '../../api/client';
import type { Estado, Solicitud, Usuario } from '../../api/types';
import { useAuth } from '../../context/auth';
import { useApi } from '../../utils/useApi';
import { Badge, Button, Card, Empty, ErrorView, Field, FormError, InfoRow, Loading, SectionTitle, Select, styles } from '../../components/ui';
import { HistorialItem } from '../../components/HistorialItem';
import { colors, spacing } from '../../theme';
import { fecha, prioridadInfo } from '../../utils/format';

/** Asignación de técnico (solo administradores). */
function AsignarTecnico({ s, onDone }: { s: Solicitud; onDone: (s: Solicitud) => void }) {
  const [tecnicos, setTecnicos] = useState<Usuario[]>([]);
  const [tecnicoId, setTecnicoId] = useState<number | null>(s.tecnico?.id ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    CatalogoApi.tecnicos().then(setTecnicos).catch((e) => setError(errorMessage(e)));
  }, []);

  const asignar = async () => {
    if (!tecnicoId) return setError('Selecciona un técnico.');
    setSaving(true);
    setError(null);
    try {
      onDone(await SolicitudesApi.asignar(s.id, tecnicoId));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <Text style={[styles.title, { marginBottom: spacing.md }]}>{s.tecnico ? 'Reasignar técnico' : 'Asignar técnico'}</Text>
      <FormError message={error} />
      <Select label="Técnico" value={tecnicoId} options={tecnicos.map((t) => ({ value: t.id, label: t.nombre }))} onChange={setTecnicoId} />
      <Button title="Asignar" icon="person-add" onPress={asignar} loading={saving} disabled={tecnicoId === s.tecnico?.id} />
    </Card>
  );
}

/** Registro de diagnóstico y solución (técnico asignado o administrador). */
function RegistrarDiagnostico({ s, estados, onDone }: { s: Solicitud; estados: Estado[]; onDone: (s: Solicitud) => void }) {
  const [diagnostico, setDiagnostico] = useState(s.diagnostico ?? '');
  const [solucion, setSolucion] = useState(s.solucion ?? '');
  const [estadoId, setEstadoId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const guardar = async () => {
    if (diagnostico.trim().length < 5) return setErrors({ diagnostico: ['Escribe el diagnóstico (mínimo 5 caracteres).'] });
    setSaving(true);
    setError(null);
    setErrors({});
    try {
      onDone(await SolicitudesApi.diagnostico(s.id, { diagnostico: diagnostico.trim(), solucion: solucion.trim(), estado_id: estadoId }));
      setEstadoId(null);
    } catch (e) {
      if (e instanceof ApiError && e.status === 422) setErrors(e.errors);
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <Text style={[styles.title, { marginBottom: spacing.md }]}>Diagnóstico y solución</Text>
      <FormError message={error} />
      <Field label="Diagnóstico *" value={diagnostico} onChangeText={setDiagnostico} multiline placeholder="Causa encontrada tras la revisión" error={errors.diagnostico?.[0]} />
      <Field label="Solución aplicada" value={solucion} onChangeText={setSolucion} multiline placeholder="Acciones realizadas para resolver la falla" error={errors.solucion?.[0]} />
      <Select
        label="Actualizar estado (opcional)"
        value={estadoId}
        options={estados.filter((e) => e.id !== s.estado.id).map((e) => ({ value: e.id, label: e.nombre }))}
        onChange={setEstadoId}
        placeholder={`Mantener "${s.estado.nombre}"`}
        error={errors.estado_id?.[0]}
      />
      <Button title="Guardar diagnóstico" icon="save-outline" onPress={guardar} loading={saving} />
    </Card>
  );
}

/** Cambio de estado con comentario. */
function CambiarEstado({ s, estados, onDone }: { s: Solicitud; estados: Estado[]; onDone: (s: Solicitud) => void }) {
  const [estadoId, setEstadoId] = useState<number | null>(null);
  const [comentario, setComentario] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const guardar = async () => {
    if (!estadoId) return setError('Selecciona el nuevo estado.');
    setSaving(true);
    setError(null);
    try {
      onDone(await SolicitudesApi.cambiarEstado(s.id, estadoId, comentario.trim()));
      setEstadoId(null);
      setComentario('');
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <Text style={[styles.title, { marginBottom: spacing.md }]}>Cambiar estado</Text>
      <FormError message={error} />
      <Select label="Nuevo estado" value={estadoId} options={estados.filter((e) => e.id !== s.estado.id).map((e) => ({ value: e.id, label: e.nombre }))} onChange={setEstadoId} />
      <Field label="Comentario" value={comentario} onChangeText={setComentario} multiline placeholder="Motivo del cambio" />
      <Button title="Actualizar estado" icon="swap-horizontal" variant="secondary" onPress={guardar} loading={saving} />
    </Card>
  );
}

export default function SolicitudDetalle() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const solicitudId = Number(id);
  const { user, hasRole } = useAuth();
  const { data: s, error, loading, refreshing, reload, setData } = useApi(() => SolicitudesApi.get(solicitudId), [solicitudId]);
  const [estados, setEstados] = useState<Estado[]>([]);

  useEffect(() => {
    CatalogoApi.estados().then(setEstados).catch(() => setEstados([]));
  }, []);

  if (loading) return <Loading />;
  if (error || !s) return <ErrorView message={error ?? 'Solicitud no encontrada'} onRetry={reload} />;

  const esAdmin = hasRole('admin');
  const esTecnicoAsignado = hasRole('tecnico') && s.tecnico?.id === user?.id;
  const puedeAtender = esAdmin || esTecnicoAsignado;
  const cerrada = s.estado.es_final;
  const p = prioridadInfo(s.prioridad);

  // Tras una acción, la API devuelve la solicitud actualizada; se recarga para traer el historial nuevo.
  const onDone = (updated: Solicitud) => {
    setData((prev) => ({ ...updated, historial: updated.historial ?? prev?.historial }));
    reload();
  };

  const historial = s.historial ?? [];

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: `Solicitud #${s.id}` }} />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={reload} />}>
        <Card>
          <View style={[styles.row, { gap: spacing.sm, marginBottom: spacing.sm, flexWrap: 'wrap' }]}>
            <Badge label={s.estado.nombre} color={s.estado.color || colors.primary} />
            <Badge label={`Prioridad ${p.label}`} color={p.color} />
          </View>
          <Text style={[styles.title, { fontSize: 19 }]}>{s.titulo}</Text>
          <Text style={{ color: colors.text, marginTop: spacing.sm, lineHeight: 20 }}>{s.descripcion}</Text>
          <View style={{ marginTop: spacing.md }}>
            <InfoRow
              label="Equipo"
              value={
                s.equipo ? (
                  <Text style={{ color: colors.primary, fontWeight: '600' }} onPress={() => router.push(`/equipo/${s.equipo!.id}`)}>
                    {s.equipo.codigo_inventario} · {s.equipo.nombre}
                  </Text>
                ) : null
              }
            />
            <InfoRow label="Tipo" value={s.categoria?.nombre} />
            <InfoRow label="Solicitante" value={s.solicitante?.nombre} />
            <InfoRow label="Técnico" value={s.tecnico?.nombre ?? 'Sin asignar'} />
            <InfoRow label="Creada" value={fecha(s.created_at, true)} />
            <InfoRow label="Asignada" value={fecha(s.fecha_asignacion, true)} />
            <InfoRow label="Cerrada" value={fecha(s.fecha_cierre, true)} />
          </View>
        </Card>

        {(s.diagnostico || s.solucion) && (
          <Card>
            <Text style={styles.title}>Diagnóstico</Text>
            <Text style={{ color: colors.text, marginTop: 4 }}>{s.diagnostico ?? '—'}</Text>
            <Text style={[styles.title, { marginTop: spacing.md }]}>Solución</Text>
            <Text style={{ color: colors.text, marginTop: 4 }}>{s.solucion || 'Pendiente'}</Text>
          </Card>
        )}

        {esAdmin && !cerrada && <AsignarTecnico s={s} onDone={onDone} />}
        {puedeAtender && !cerrada && <RegistrarDiagnostico s={s} estados={estados} onDone={onDone} />}
        {puedeAtender && <CambiarEstado s={s} estados={estados} onDone={onDone} />}

        <SectionTitle>Historial de atención</SectionTitle>
        <Card>
          {historial.length ? (
            historial.map((h, i) => <HistorialItem key={h.id} h={h} last={i === historial.length - 1} />)
          ) : (
            <Empty text="Sin movimientos registrados." />
          )}
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
