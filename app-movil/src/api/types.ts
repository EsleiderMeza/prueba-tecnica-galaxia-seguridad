// Tipos que reflejan el contrato de la API Laravel (ver docs/API_CONTRACT.md).

export type RolSlug = 'admin' | 'tecnico' | 'usuario';

export interface Rol {
  id: number;
  nombre: string;
  slug: RolSlug;
}

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: Rol;
}

export type TipoCategoria = 'equipo' | 'solicitud';

export interface Categoria {
  id: number;
  nombre: string;
  tipo: TipoCategoria;
}

export interface Estado {
  id: number;
  nombre: string;
  slug: string; // abierta, asignada, en_proceso, resuelta, cerrada, cancelada
  color: string; // hex, p. ej. #2563EB
  es_final: boolean;
}

export type EstadoEquipo = 'operativo' | 'en_mantenimiento' | 'dado_de_baja';
export type Prioridad = 'baja' | 'media' | 'alta' | 'critica';

export interface EquipoResumen {
  id: number;
  codigo_inventario: string;
  nombre: string;
}

export interface Equipo extends EquipoResumen {
  categoria: Categoria | null;
  marca: string | null;
  modelo: string | null;
  serial: string | null;
  ubicacion: string | null;
  responsable: string | null;
  estado: EstadoEquipo;
  fecha_adquisicion: string | null; // YYYY-MM-DD
  observaciones: string | null;
  solicitudes_count?: number;
  solicitudes?: Solicitud[];
  created_at: string;
  updated_at: string;
}

export interface EquipoInput {
  codigo_inventario: string;
  nombre: string;
  categoria_id: number | null;
  marca: string;
  modelo: string;
  serial: string;
  ubicacion: string;
  responsable: string;
  estado: EstadoEquipo;
  fecha_adquisicion: string | null;
  observaciones: string;
}

export interface Historial {
  id: number;
  solicitud_id: number;
  accion: 'creada' | 'asignada' | 'estado' | 'diagnostico' | 'comentario';
  descripcion: string;
  estado_anterior: Estado | null;
  estado_nuevo: Estado | null;
  usuario: Pick<Usuario, 'id' | 'nombre'> | null;
  solicitud?: { id: number; titulo: string; equipo: EquipoResumen | null };
  created_at: string;
}

export interface Solicitud {
  id: number;
  titulo: string;
  descripcion: string;
  prioridad: Prioridad;
  equipo: EquipoResumen | null;
  categoria: Categoria | null;
  estado: Estado;
  solicitante: Pick<Usuario, 'id' | 'nombre' | 'email'> | null;
  tecnico: Pick<Usuario, 'id' | 'nombre' | 'email'> | null;
  diagnostico: string | null;
  solucion: string | null;
  fecha_asignacion: string | null;
  fecha_cierre: string | null;
  historial?: Historial[];
  created_at: string;
  updated_at: string;
}

export interface SolicitudInput {
  equipo_id: number | null;
  categoria_id: number | null;
  titulo: string;
  descripcion: string;
  prioridad: Prioridad;
}

export interface Conteo {
  total: number;
}

export interface Dashboard {
  equipos_total: number;
  solicitudes_total: number;
  solicitudes_abiertas: number;
  mis_asignadas: number;
  por_estado: (Pick<Estado, 'id' | 'nombre' | 'slug' | 'color'> & Conteo)[];
  recientes: Solicitud[];
}

export interface Inventario {
  total: number;
  por_categoria: { id: number | null; nombre: string; total: number }[];
  por_estado: { estado: EstadoEquipo; total: number }[];
  por_ubicacion: { ubicacion: string; total: number }[];
}

export interface Paginated<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface LoginResponse {
  token: string;
  user: Usuario;
}
