# Referencia de la API

Base: `http://localhost:8000/api` en local. Todas las peticiones llevan `Accept: application/json`; las protegidas, `Authorization: Bearer <token>`.

Formato:
- Un recurso: `{ "data": { ... } }`
- Listas paginadas: `{ "data": [...], "links": {...}, "meta": { current_page, last_page, per_page, total } }`. `per_page` por defecto 10, máximo 100.
- Errores: `{ "message": "..." }` y en validación (422) también `"errors": { "campo": ["..."] }`.

| Código | Cuándo |
|---|---|
| 401 | Sin token o token inválido (`Unauthenticated.`) |
| 403 | El rol no tiene permiso |
| 404 | El recurso no existe |
| 409 | No se puede eliminar porque está en uso |
| 422 | Datos inválidos o credenciales incorrectas |
| 429 | Demasiados intentos de inicio de sesión (10 por minuto) |
| 500 | Error interno (sin detalles en producción) |

## Permisos por rol

| Acción | admin | tecnico | usuario |
|---|:-:|:-:|:-:|
| Ver equipos, inventario, catálogos | ✔ | ✔ | ✔ |
| Crear / editar equipos | ✔ | ✔ | |
| Eliminar equipos | ✔ | | |
| Crear solicitudes | ✔ | ✔ | ✔ |
| Ver solicitudes | todas | asignadas a él y propias | propias |
| Asignar técnico | ✔ | | |
| Diagnosticar y cambiar estado | ✔ | solo si es el técnico asignado | |
| Administrar usuarios, categorías y estados | ✔ | | |

## Rutas

### Autenticación
| Método | Ruta | Cuerpo | Respuesta |
|---|---|---|---|
| POST | `/login` | `email, password, device_name?` | `{ token, user }` |
| POST | `/logout` | — | `{ message }` (revoca el token actual) |
| GET | `/me` | — | `{ data: Usuario }` |

### Panel e informes
| Método | Ruta | Query | Respuesta |
|---|---|---|---|
| GET | `/dashboard` | — | `equipos_total, solicitudes_total, solicitudes_abiertas, mis_asignadas, por_estado[], recientes[5]` |
| GET | `/inventario` | — | `total, por_categoria[], por_estado[], por_ubicacion[]` |
| GET | `/historial` | `solicitud_id, equipo_id, page, per_page` | Historial paginado, más reciente primero, con `solicitud` |

### Catálogos
| Método | Ruta | Notas |
|---|---|---|
| GET | `/categorias?tipo=equipo\|solicitud` | Todos |
| GET | `/estados` | Todos |
| GET | `/tecnicos` | Técnicos activos |
| GET | `/roles` | Todos |
| POST/PUT/DELETE | `/categorias`, `/categorias/{id}` | Admin. `nombre*, tipo*, descripcion, activo` |
| POST/PUT/DELETE | `/estados`, `/estados/{id}` | Admin. `nombre*, slug, color (#RRGGBB), es_final, orden` |

### Equipos
| Método | Ruta | Cuerpo / query | Rol |
|---|---|---|---|
| GET | `/equipos` | `search, estado, categoria_id, page, per_page` | Todos |
| GET | `/equipos/{id}` | — (incluye `solicitudes`) | Todos |
| POST | `/equipos` | `codigo_inventario*` (único), `nombre*`, `categoria_id*`, `estado*` (operativo, en_mantenimiento, dado_de_baja), `marca, modelo, serial, ubicacion, responsable, fecha_adquisicion (AAAA-MM-DD), observaciones` | admin, técnico |
| PUT | `/equipos/{id}` | igual que POST | admin, técnico |
| DELETE | `/equipos/{id}` | 204, o 409 si tiene solicitudes | admin |

### Solicitudes
| Método | Ruta | Cuerpo / query | Rol |
|---|---|---|---|
| GET | `/solicitudes` | `search` (número, título o código de equipo), `estado_id, prioridad, equipo_id, asignadas_a_mi=1, page, per_page` | Todos (filtrado por rol) |
| POST | `/solicitudes` | `equipo_id*, categoria_id*, titulo*` (5–150), `descripcion*` (mín. 10), `prioridad*` (baja, media, alta, critica) | Todos |
| GET | `/solicitudes/{id}` | — (incluye `historial` en orden cronológico) | Quien puede verla |
| POST | `/solicitudes/{id}/asignar` | `tecnico_id*` | admin |
| POST | `/solicitudes/{id}/diagnostico` | `diagnostico*` (mín. 5), `solucion, estado_id` | admin, técnico asignado |
| POST | `/solicitudes/{id}/estado` | `estado_id*, comentario` | admin, técnico asignado |
| POST | `/solicitudes/{id}/comentarios` | `comentario*` | Quien puede verla |

Reglas del flujo:
- Al crear, el estado es `abierta` y se registra `creada` en el historial.
- Al asignar, si estaba `abierta` pasa a `asignada`, se guarda `fecha_asignacion` y una fila en `asignaciones`. Reasignar desactiva la asignación anterior.
- Al pasar a un estado final (cerrada, cancelada) se guarda `fecha_cierre`; si se reabre, se borra.
- Una solicitud finalizada no acepta diagnóstico ni asignación hasta que se reabra cambiando su estado.

### Usuarios (admin)
| Método | Ruta | Cuerpo |
|---|---|---|
| GET | `/usuarios?search=&rol=` | Paginado |
| POST | `/usuarios` | `nombre*, email*, password*` (mín. 8), `rol_id*, activo` |
| GET | `/usuarios/{id}` | — |
| PUT | `/usuarios/{id}` | Los mismos campos, todos opcionales. Desactivar cierra sus sesiones |
| DELETE | `/usuarios/{id}` | 204, o 409 si tiene solicitudes |
