# Contrato de la API (app móvil ↔ Laravel)

> **Estado:** propuesta escrita desde la app móvil. El backend Laravel debe implementar
> estas rutas y formas de respuesta (o la app se ajusta si el backend decide otra cosa).
> Los puntos marcados **[supuesto]** son decisiones tomadas sin confirmar.

- Base: `https://<host>/api`
- Autenticación: **Laravel Sanctum** con token Bearer (`Authorization: Bearer <token>`).
- Siempre se envía `Accept: application/json`, así Laravel responde errores en JSON.
- Recursos individuales envueltos en `{ "data": ... }` (API Resources).
- Listas paginadas: `{ "data": [...], "meta": { current_page, last_page, per_page, total } }`
  (formato estándar de `ResourceCollection` paginada; `links` se ignora). `per_page` por defecto 10, máx. 100.
- Fechas en ISO 8601 (`2026-11-26T17:49:00.000000Z`); `fecha_adquisicion` como `YYYY-MM-DD`.

## Errores

| Código | Cuerpo | Uso en la app |
|---|---|---|
| 401 | `{ "message": "Unauthenticated." }` | Cierra la sesión y vuelve al login |
| 403 | `{ "message": "..." }` | Muestra el mensaje |
| 404 | `{ "message": "..." }` | Muestra el mensaje |
| 422 | `{ "message": "...", "errors": { "campo": ["..."] } }` | Muestra cada error bajo su campo |
| 500 | `{ "message": "..." }` | Muestra el mensaje |

## Roles **[supuesto]**

| slug | Puede |
|---|---|
| `admin` | Todo: ver todas las solicitudes, asignar técnicos, crear/editar/eliminar equipos, diagnosticar, cambiar estado |
| `tecnico` | Crear/editar equipos; ver solicitudes asignadas a él y las propias; diagnosticar y cambiar estado de las asignadas |
| `usuario` | Consultar equipos e inventario; crear solicitudes y ver solo las propias |

## Objetos

```jsonc
// Usuario
{ "id": 1, "nombre": "Ana Admin", "email": "admin@galaxia.com", "rol": { "id": 1, "nombre": "Administrador", "slug": "admin" } }

// Categoria (una tabla para equipos y solicitudes, separadas por "tipo")
{ "id": 1, "nombre": "Portátil", "tipo": "equipo" }         // tipo: equipo | solicitud

// Estado de solicitud
{ "id": 1, "nombre": "Abierta", "slug": "abierta", "color": "#2563EB", "es_final": false }
// Semilla sugerida: abierta, asignada, en_proceso, resuelta, cerrada (es_final=true), cancelada (es_final=true)

// Equipo
{
  "id": 1, "codigo_inventario": "GS-001", "nombre": "PC Recepción",
  "categoria": { Categoria } | null,
  "marca": "Dell", "modelo": "OptiPlex 3080", "serial": "SN123",
  "ubicacion": "Sede principal", "responsable": "Juan Pérez",
  "estado": "operativo",                // operativo | en_mantenimiento | dado_de_baja
  "fecha_adquisicion": "2024-05-10", "observaciones": null,
  "solicitudes": [ Solicitud ],          // solo en GET /equipos/{id}
  "created_at": "...", "updated_at": "..."
}

// Solicitud
{
  "id": 3, "titulo": "El portátil no enciende", "descripcion": "...",
  "prioridad": "media",                 // baja | media | alta | critica
  "equipo": { "id": 1, "codigo_inventario": "GS-001", "nombre": "PC Recepción" },
  "categoria": { Categoria },
  "estado": { Estado },
  "solicitante": { "id": 4, "nombre": "...", "email": "..." },
  "tecnico": { "id": 2, "nombre": "...", "email": "..." } | null,
  "diagnostico": null, "solucion": null,
  "fecha_asignacion": null, "fecha_cierre": null,
  "historial": [ Historial ],            // solo en GET /solicitudes/{id}, orden cronológico ascendente
  "created_at": "...", "updated_at": "..."
}

// Historial (una fila por cada acción sobre una solicitud)
{
  "id": 10, "solicitud_id": 3,
  "accion": "asignada",                 // creada | asignada | estado | diagnostico | comentario
  "descripcion": "Asignada a Tomás Técnico",
  "estado_anterior": { Estado } | null, "estado_nuevo": { Estado } | null,
  "usuario": { "id": 1, "nombre": "Ana Admin" },
  "solicitud": { "id": 3, "titulo": "...", "equipo": { ... } },   // solo en GET /historial
  "created_at": "..."
}
```

## Rutas

| Método | Ruta | Cuerpo / query | Respuesta | Rol |
|---|---|---|---|---|
| POST | `/login` | `email, password, device_name` | `{ token, user: Usuario }` (422 si credenciales malas) | público |
| POST | `/logout` | — | 200/204 | todos |
| GET | `/me` | — | `{ data: Usuario }` | todos |
| GET | `/dashboard` | — | `{ data: { equipos_total, solicitudes_total, solicitudes_abiertas, mis_asignadas, por_estado: [{id,nombre,slug,color,total}], recientes: [Solicitud x5] } }` (conteos según lo que el usuario puede ver; `mis_asignadas` = asignadas a mí si es técnico, con técnico si es admin) | todos |
| GET | `/categorias` | `?tipo=equipo\|solicitud` | `{ data: Categoria[] }` | todos |
| GET | `/estados` | — | `{ data: Estado[] }` | todos |
| GET | `/tecnicos` | — | `{ data: Usuario[] }` (rol técnico, activos) | todos |
| GET | `/equipos` | `?search=&estado=&categoria_id=&page=&per_page=` | paginado de Equipo. `search` busca en código, nombre, serial, marca, modelo, ubicación | todos |
| POST | `/equipos` | `codigo_inventario*` (único), `nombre*`, `categoria_id*`, `marca, modelo, serial, ubicacion, responsable, estado*, fecha_adquisicion (date), observaciones` | 201 `{ data: Equipo }` | admin, técnico |
| GET | `/equipos/{id}` | — | `{ data: Equipo }` con `solicitudes` | todos |
| PUT | `/equipos/{id}` | igual que POST | `{ data: Equipo }` | admin, técnico |
| DELETE | `/equipos/{id}` | — | 204 (409/422 si tiene solicitudes, **[supuesto]**) | admin |
| GET | `/inventario` | — | `{ data: { total, por_categoria: [{id,nombre,total}], por_estado: [{estado,total}], por_ubicacion: [{ubicacion,total}] } }` | todos |
| GET | `/solicitudes` | `?search=&estado_id=&prioridad=&equipo_id=&asignadas_a_mi=1&page=` | paginado de Solicitud (filtrado por rol). `search` en id, título, código de equipo | todos |
| POST | `/solicitudes` | `equipo_id*, categoria_id*, titulo* (5-150), descripcion* (min 10), prioridad*` | 201 `{ data: Solicitud }`; estado inicial `abierta`; crea historial `creada` | todos |
| GET | `/solicitudes/{id}` | — | `{ data: Solicitud }` con `historial` | quien puede verla |
| POST | `/solicitudes/{id}/asignar` | `tecnico_id*` | `{ data: Solicitud }`; fija `fecha_asignacion`, pasa a `asignada` si estaba `abierta`; historial `asignada` | admin |
| POST | `/solicitudes/{id}/diagnostico` | `diagnostico*, solucion, estado_id` | `{ data: Solicitud }`; historial `diagnostico` | admin, técnico asignado |
| POST | `/solicitudes/{id}/estado` | `estado_id*, comentario` | `{ data: Solicitud }`; si el estado es final fija `fecha_cierre`; historial `estado` | admin, técnico asignado |
| GET | `/historial` | `?solicitud_id=&equipo_id=&page=` | paginado de Historial, más reciente primero, con `solicitud` | todos (filtrado por rol) |

## CORS

La app nativa no necesita CORS. Solo hace falta si se prueba la versión web (`npx expo start --web`).
