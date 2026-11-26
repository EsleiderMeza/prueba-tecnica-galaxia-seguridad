import { api } from './client';
import type {
  Categoria,
  Dashboard,
  Equipo,
  EquipoInput,
  Estado,
  Historial,
  Inventario,
  LoginResponse,
  Paginated,
  Solicitud,
  SolicitudInput,
  TipoCategoria,
  Usuario,
} from './types';

type Data<T> = { data: T };

export const AuthApi = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>('/login', { email, password, device_name: 'app-movil' }),
  logout: () => api.post<unknown>('/logout'),
  me: () => api.get<Data<Usuario>>('/me').then((r) => r.data),
};

export const DashboardApi = {
  get: () => api.get<Data<Dashboard>>('/dashboard').then((r) => r.data),
};

export const CatalogoApi = {
  categorias: (tipo?: TipoCategoria) =>
    api.get<Data<Categoria[]>>('/categorias', { tipo }).then((r) => r.data),
  estados: () => api.get<Data<Estado[]>>('/estados').then((r) => r.data),
  tecnicos: () => api.get<Data<Usuario[]>>('/tecnicos').then((r) => r.data),
};

export const EquiposApi = {
  list: (q: { search?: string; categoria_id?: number; estado?: string; page?: number; per_page?: number }) =>
    api.get<Paginated<Equipo>>('/equipos', q),
  get: (id: number) => api.get<Data<Equipo>>(`/equipos/${id}`).then((r) => r.data),
  create: (input: EquipoInput) => api.post<Data<Equipo>>('/equipos', input).then((r) => r.data),
  update: (id: number, input: EquipoInput) =>
    api.put<Data<Equipo>>(`/equipos/${id}`, input).then((r) => r.data),
  remove: (id: number) => api.delete<unknown>(`/equipos/${id}`),
};

export const InventarioApi = {
  get: () => api.get<Data<Inventario>>('/inventario').then((r) => r.data),
};

export const SolicitudesApi = {
  list: (q: {
    search?: string;
    estado_id?: number;
    prioridad?: string;
    equipo_id?: number;
    asignadas_a_mi?: 1;
    page?: number;
  }) => api.get<Paginated<Solicitud>>('/solicitudes', q),
  get: (id: number) => api.get<Data<Solicitud>>(`/solicitudes/${id}`).then((r) => r.data),
  create: (input: SolicitudInput) =>
    api.post<Data<Solicitud>>('/solicitudes', input).then((r) => r.data),
  asignar: (id: number, tecnico_id: number) =>
    api.post<Data<Solicitud>>(`/solicitudes/${id}/asignar`, { tecnico_id }).then((r) => r.data),
  diagnostico: (id: number, body: { diagnostico: string; solucion: string; estado_id: number | null }) =>
    api.post<Data<Solicitud>>(`/solicitudes/${id}/diagnostico`, body).then((r) => r.data),
  cambiarEstado: (id: number, estado_id: number, comentario: string) =>
    api.post<Data<Solicitud>>(`/solicitudes/${id}/estado`, { estado_id, comentario }).then((r) => r.data),
};

export const HistorialApi = {
  list: (q: { solicitud_id?: number; equipo_id?: number; page?: number }) =>
    api.get<Paginated<Historial>>('/historial', q),
};
