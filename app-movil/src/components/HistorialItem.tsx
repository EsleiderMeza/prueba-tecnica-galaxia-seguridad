import { Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { Historial } from '../api/types';
import { colors, spacing } from '../theme';
import { fecha } from '../utils/format';

const ICONOS: Record<Historial['accion'], keyof typeof Ionicons.glyphMap> = {
  creada: 'add-circle',
  asignada: 'person-add',
  estado: 'swap-horizontal',
  diagnostico: 'construct',
  comentario: 'chatbubble-ellipses',
};

/** Un evento de la línea de tiempo de atención. */
export function HistorialItem({ h, showSolicitud = false, last = false }: { h: Historial; showSolicitud?: boolean; last?: boolean }) {
  return (
    <View style={{ flexDirection: 'row' }}>
      <View style={{ alignItems: 'center', width: 28 }}>
        <Ionicons name={ICONOS[h.accion] ?? 'ellipse'} size={20} color={colors.primary} />
        {!last && <View style={{ flex: 1, width: 2, backgroundColor: colors.border, marginVertical: 2 }} />}
      </View>
      <View style={{ flex: 1, paddingBottom: spacing.lg, paddingLeft: spacing.sm }}>
        {showSolicitud && h.solicitud && (
          <Text style={{ fontWeight: '700', color: colors.text }} numberOfLines={1}>
            #{h.solicitud.id} {h.solicitud.titulo}
          </Text>
        )}
        <Text style={{ color: colors.text }}>{h.descripcion}</Text>
        {h.estado_nuevo && (
          <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>
            {h.estado_anterior ? `${h.estado_anterior.nombre} → ` : ''}
            {h.estado_nuevo.nombre}
          </Text>
        )}
        <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>
          {h.usuario?.nombre ?? 'Sistema'} · {fecha(h.created_at, true)}
        </Text>
      </View>
    </View>
  );
}
