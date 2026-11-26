# Modelo de base de datos

Base de datos relacional con llaves foráneas. Funciona igual en SQLite (local), PostgreSQL y MySQL.

```mermaid
erDiagram
    roles ||--o{ users : "tiene"
    categorias ||--o{ equipos : "clasifica"
    categorias ||--o{ solicitudes : "clasifica"
    estados ||--o{ solicitudes : "estado actual"
    equipos ||--o{ solicitudes : "afectado"
    users ||--o{ solicitudes : "solicitante"
    users ||--o{ solicitudes : "técnico asignado"
    solicitudes ||--o{ asignaciones : "registra"
    users ||--o{ asignaciones : "técnico / asignado por"
    solicitudes ||--o{ historial : "acciones"
    users ||--o{ historial : "realizó"
    estados ||--o{ historial : "anterior / nuevo"

    roles {
        bigint id PK
        string nombre
        string slug UK
        string descripcion
    }
    users {
        bigint id PK
        string nombre
        string email UK
        string password
        bigint rol_id FK
        bool activo
    }
    categorias {
        bigint id PK
        string nombre
        string tipo "equipo|solicitud"
        bool activo
    }
    estados {
        bigint id PK
        string nombre
        string slug UK
        string color
        bool es_final
        int orden
    }
    equipos {
        bigint id PK
        string codigo_inventario UK
        string nombre
        bigint categoria_id FK
        string marca
        string modelo
        string serial
        string ubicacion
        string responsable
        string estado
        date fecha_adquisicion
        text observaciones
    }
    solicitudes {
        bigint id PK
        string titulo
        text descripcion
        string prioridad
        bigint equipo_id FK
        bigint categoria_id FK
        bigint estado_id FK
        bigint solicitante_id FK
        bigint tecnico_id FK
        text diagnostico
        text solucion
        timestamp fecha_asignacion
        timestamp fecha_cierre
    }
    asignaciones {
        bigint id PK
        bigint solicitud_id FK
        bigint tecnico_id FK
        bigint asignado_por_id FK
        bool activa
    }
    historial {
        bigint id PK
        bigint solicitud_id FK
        bigint user_id FK
        string accion
        text descripcion
        bigint estado_anterior_id FK
        bigint estado_nuevo_id FK
        timestamp created_at
    }
```

## Tablas

| Tabla | Para qué sirve |
|---|---|
| `roles` | admin, tecnico, usuario |
| `users` | Usuarios del sistema; cada uno con un rol. `activo = false` impide iniciar sesión |
| `categorias` | Una sola tabla para categorías de equipos y de solicitudes (columna `tipo`) |
| `estados` | Estados de las solicitudes. `es_final = true` (cerrada, cancelada) fija la fecha de cierre |
| `equipos` | Inventario tecnológico. `codigo_inventario` es único |
| `solicitudes` | Solicitudes de soporte con su técnico actual, diagnóstico y solución |
| `asignaciones` | Cada asignación o reasignación de técnico (la vigente tiene `activa = true`) |
| `historial` | Historial de atención: una fila por acción (creada, asignada, diagnóstico, cambio de estado, comentario) |
| `personal_access_tokens` | Tokens de Sanctum (sesiones de la app) |

## Reglas de integridad

- No se puede borrar un equipo, categoría, estado o usuario que tenga solicitudes (la API responde 409 y sugiere darlo de baja o desactivarlo).
- Al borrar una solicitud se borran sus asignaciones e historial (`cascade`).
- Las solicitudes solo aceptan categorías de tipo `solicitud` y equipos que no estén dados de baja; los equipos solo aceptan categorías de tipo `equipo`.
