# Documentación de la API REST

API del sistema de soporte técnico e inventario tecnológico de Galaxia Seguridad, hecha en **Laravel 13 + Sanctum**.

| Entorno | URL base |
|---|---|
| Producción (Render) | `https://galaxia-soporte-api.onrender.com/api` |
| Local | `http://localhost:8000/api` |

- Comprobación de que el servidor está vivo: `GET https://galaxia-soporte-api.onrender.com/up` (responde 200).
- `GET /api` sin token responde `{"nombre":"API Soporte Técnico · Galaxia Seguridad","version":"1.0","estado":"ok"}`.
- El plan gratuito de Render apaga el servidor tras 15 minutos sin uso: la primera petición puede tardar 30 a 60 segundos.

Usuarios de prueba (contraseña `password`): `admin@galaxia.com` (administrador), `tecnico@galaxia.com` y `tecnico2@galaxia.com` (técnicos), `usuario@galaxia.com` (usuario).

## Convenciones

- Todas las peticiones llevan `Accept: application/json`. Las que envían datos, `Content-Type: application/json`.
- Las rutas protegidas llevan `Authorization: Bearer <token>`. El token se obtiene en `POST /login` (Laravel Sanctum).
- Un recurso: `{ "data": { ... } }`
- Listas paginadas: `{ "data": [...], "links": {...}, "meta": { current_page, last_page, per_page, total } }`. `per_page` por defecto 10, máximo 100.
- Fechas en ISO 8601 (`2026-11-26T17:49:00.000000Z`); `fecha_adquisicion` como `AAAA-MM-DD`.
- Errores: `{ "message": "..." }` y en validación (422) también `"errors": { "campo": ["..."] }`. Los mensajes están en español.

| Código | Cuándo |
|---|---|
| 200 / 201 / 204 | Correcto / creado / eliminado sin contenido |
| 401 | Sin token o token inválido (`Unauthenticated.`) |
| 403 | El rol no tiene permiso |
| 404 | El recurso no existe (`El equipo no existe.`) |
| 405 | Método HTTP no permitido en esa ruta |
| 409 | No se puede eliminar porque está en uso |
| 422 | Datos inválidos o credenciales incorrectas |
| 429 | Demasiados intentos de inicio de sesión (10 por minuto) |
| 500 | Error interno (sin detalles en producción) |

## Ejemplo rápido

### Con PowerShell (Windows)

```powershell
$api = "https://galaxia-soporte-api.onrender.com/api"
$r = Invoke-RestMethod -Method Post -Uri "$api/login" -ContentType 'application/json' `
     -Body '{"email":"admin@galaxia.com","password":"password","device_name":"pc"}'
$h = @{ Authorization = "Bearer $($r.token)"; Accept = 'application/json' }

Invoke-RestMethod -Uri "$api/dashboard" -Headers $h | ConvertTo-Json -Depth 5
Invoke-RestMethod -Uri "$api/equipos?search=dell" -Headers $h | ConvertTo-Json -Depth 5
```

### Con curl

```bash
curl -X POST https://galaxia-soporte-api.onrender.com/api/login \
  -H "Accept: application/json" -H "Content-Type: application/json" \
  -d '{"email":"admin@galaxia.com","password":"password","device_name":"curl"}'

curl https://galaxia-soporte-api.onrender.com/api/solicitudes \
  -H "Accept: application/json" -H "Authorization: Bearer <token>"
```

### Respuestas de ejemplo

`POST /login` correcto:

```json
{
  "token": "12|Qm9kZ2V0b2tlbi1lamVtcGxv...",
  "user": { "id": 1, "nombre": "Ana Admin", "email": "admin@galaxia.com", "activo": true,
            "rol": { "id": 1, "nombre": "Administrador", "slug": "admin" } }
}
```

`POST /login` con clave errónea (422):

```json
{ "message": "Las credenciales no son válidas.", "errors": { "email": ["Las credenciales no son válidas."] } }
```

`POST /equipos` con código repetido (422):

```json
{
  "message": "Ya existe un equipo con este código de inventario.",
  "errors": { "codigo_inventario": ["Ya existe un equipo con este código de inventario."] }
}
```

`GET /solicitudes/1` (resumido):

```json
{
  "data": {
    "id": 1, "titulo": "El portátil no carga la batería", "prioridad": "media",
    "equipo": { "id": 6, "codigo_inventario": "GS-006", "nombre": "Portátil Gerencia" },
    "categoria": { "id": 7, "nombre": "Hardware", "tipo": "solicitud" },
    "estado": { "id": 5, "nombre": "Cerrada", "slug": "cerrada", "color": "#475569", "es_final": true },
    "solicitante": { "id": 4, "nombre": "Uriel Usuario" },
    "tecnico": { "id": 3, "nombre": "Laura Técnica" },
    "diagnostico": "Cargador defectuoso (no entrega voltaje).",
    "solucion": "Se reemplazó el cargador por uno original de 65W.",
    "fecha_asignacion": "...", "fecha_cierre": "...",
    "historial": [
      { "accion": "creada", "descripcion": "Solicitud creada", "usuario": { "nombre": "Uriel Usuario" } },
      { "accion": "asignada", "descripcion": "Asignada a Laura Técnica", "estado_anterior": { "nombre": "Abierta" }, "estado_nuevo": { "nombre": "Asignada" } }
    ]
  }
}
```

La forma completa de cada objeto (Usuario, Categoría, Estado, Equipo, Solicitud, Historial) está en el contrato [`app-movil/docs/API_CONTRACT.md`](../app-movil/docs/API_CONTRACT.md). Las pruebas automáticas que verifican estas respuestas están en [`backend/tests/Feature/ApiTest.php`](../backend/tests/Feature/ApiTest.php).

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
