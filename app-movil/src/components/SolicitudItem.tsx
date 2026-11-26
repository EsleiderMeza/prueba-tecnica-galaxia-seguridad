import { Text, View } from 'react-native';
import { router } from 'expo-router';
import type { Solicitud } from '../api/types';
import { Badge, Card, styles } from './ui';
import { colors } from '../theme';
import { fecha, prioridadInfo } from '../utils/format';

export function SolicitudItem({ s }: { s: Solicitud }) {
  const p = prioridadInfo(s.prioridad);
  return (
    <Card onPress={() => router.push(`/solicitud/${s.id}`)}>
      <View style={[styles.row, { justifyContent: 'space-between', marginBottom: 6 }]}>
        <Text style={{ color: colors.muted, fontSize: 12 }}>#{s.id} · {fecha(s.created_at)}</Text>
        <Badge label={s.estado.nombre} color={s.estado.color || colors.primary} />
      </View>
      <Text style={styles.title} numberOfLines={2}>{s.titulo}</Text>
      <Text style={[styles.muted, { marginTop: 4 }]} numberOfLines={1}>
        {s.equipo ? `${s.equipo.codigo_inventario} · ${s.equipo.nombre}` : 'Sin equipo'}
      </Text>
      <View style={[styles.row, { justifyContent: 'space-between', marginTop: 8 }]}>
        <Badge label={`Prioridad ${p.label}`} color={p.color} />
        <Text style={{ color: colors.muted, fontSize: 12 }}>
          {s.tecnico ? `Técnico: ${s.tecnico.nombre}` : 'Sin técnico asignado'}
        </Text>
      </View>
    </Card>
  );
}
