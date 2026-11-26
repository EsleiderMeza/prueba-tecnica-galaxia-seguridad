import type { EstadoEquipo, Prioridad } from '../api/types';

export function fecha(iso: string | null | undefined, conHora = false): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  const base = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  return conHora ? `${base} ${pad(d.getHours())}:${pad(d.getMinutes())}` : base;
}

export const PRIORIDADES: { value: Prioridad; label: string; color: string }[] = [
  { value: 'baja', label: 'Baja', color: '#2E7D32' },
  { value: 'media', label: 'Media', color: '#1565C0' },
  { value: 'alta', label: 'Alta', color: '#EF6C00' },
  { value: 'critica', label: 'Crítica', color: '#C62828' },
];

export const ESTADOS_EQUIPO: { value: EstadoEquipo; label: string; color: string }[] = [
  { value: 'operativo', label: 'Operativo', color: '#2E7D32' },
  { value: 'en_mantenimiento', label: 'En mantenimiento', color: '#EF6C00' },
  { value: 'dado_de_baja', label: 'Dado de baja', color: '#757575' },
];

export const prioridadInfo = (p: Prioridad) => PRIORIDADES.find((x) => x.value === p) ?? PRIORIDADES[1];
export const estadoEquipoInfo = (e: EstadoEquipo) =>
  ESTADOS_EQUIPO.find((x) => x.value === e) ?? ESTADOS_EQUIPO[0];
