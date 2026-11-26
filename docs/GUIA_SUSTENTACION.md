# Guía para la sustentación

Esta guía explica, con palabras sencillas, todo lo que se construyó y por qué. Está pensada para leerla antes de la sustentación y poder responder con seguridad. Para aprender los conceptos de React Native y Laravel con ejemplos del propio código, ver también [GUIA_ESTUDIO_REACT_LARAVEL.md](GUIA_ESTUDIO_REACT_LARAVEL.md).

---

## 1. El proyecto en un minuto

> "Construí un sistema de soporte técnico e inventario para Galaxia Seguridad. Tiene una **app móvil en React Native** donde los usuarios reportan fallas de sus equipos, el administrador asigna un técnico y el técnico registra el diagnóstico y la solución. Todo pasa por una **API REST en Laravel** que valida los datos, controla los permisos por rol y guarda la información en una **base de datos PostgreSQL**. La API está publicada gratis en **Render**, la base de datos en **Neon**, y la app se instala como **APK** generado con **Expo EAS**. Cada acción queda en un historial de atención."

Memoriza esa idea: **app → API → base de datos**, tres roles, y el ciclo de vida de una solicitud.

---

## 2. Arquitectura: cómo se conectan las piezas

```
  Teléfono (APK)                    Render (nube)                    Neon (nube)
┌────────────────┐   HTTPS+JSON   ┌──────────────────┐    SQL/SSL   ┌──────────────┐
│ App React      │ ─────────────▶ │ API Laravel      │ ───────────▶ │ PostgreSQL   │
│ Native (Expo)  │ ◀───────────── │ (Docker, Apache) │ ◀─────────── │ (datos)      │
└────────────────┘   respuesta    └──────────────────┘              └──────────────┘
```

Una analogía útil: un restaurante.

- La **app** es el mesero: toma el pedido del cliente y lo muestra bonito.
- La **API** es la cocina: decide si el pedido es válido, quién puede pedir qué, y prepara la respuesta.
- La **base de datos** es la despensa: donde se guarda todo.

El mesero nunca entra a la despensa. La app nunca toca la base de datos directamente: siempre pide a la API. Eso es lo que la prueba llama "comunicarse con el backend desplegado".

**Ejemplo real de un viaje completo** (crear una solicitud):

1. El usuario llena el formulario y pulsa "Enviar solicitud".
2. La app hace `POST https://galaxia-soporte-api.onrender.com/api/solicitudes` con un JSON (`equipo_id`, `categoria_id`, `titulo`, `descripcion`, `prioridad`) y el token en la cabecera `Authorization: Bearer ...`.
3. Laravel revisa el token (¿quién es?), valida los datos (¿el título tiene al menos 5 letras?), crea la solicitud en estado "Abierta" y escribe "Solicitud creada" en el historial, todo dentro de una transacción.
4. Responde `201 Created` con la solicitud en JSON.
5. La app abre la pantalla de detalle con esos datos.

---

## 3. Cada tecnología y por qué la elegí

| Tecnología | Qué es | Por qué |
|---|---|---|
| **React Native** | Framework para hacer apps móviles con JavaScript/TypeScript y componentes de React | Lo pide la prueba. Un solo código sirve para Android e iOS. |
| **Expo (SDK 58)** | Conjunto de herramientas sobre React Native | Permite probar en el teléfono con Expo Go escaneando un QR y compilar el APK en la nube (EAS) sin instalar Android Studio. |
| **Expo Router** | Navegación basada en archivos | Cada archivo de `src/app/` es una pantalla; es más ordenado y fácil de explicar. |
| **TypeScript** | JavaScript con tipos | Detecta errores antes de ejecutar (por ejemplo, escribir mal el nombre de un campo de la API). |
| **expo-secure-store** | Almacenamiento cifrado del teléfono | Para guardar el token de sesión de forma segura. |
| **Laravel 13** | Framework de PHP para backend | Lo pide la prueba. Trae rutas, validación, ORM, migraciones y seguridad listos. |
| **Laravel Sanctum** | Paquete oficial de autenticación por tokens | Es la forma recomendada por Laravel para autenticar apps móviles. Más simple que OAuth/Passport. |
| **PostgreSQL** | Base de datos relacional | Robusta, gratis y la ofrece Neon con plan gratuito persistente. |
| **SQLite** | Base de datos en un solo archivo | Para trabajar en local sin instalar un servidor de base de datos. Laravel cambia de una a otra solo con el `.env`. |
| **Docker** | Empaqueta la app con todo lo que necesita (PHP, Apache, extensiones) | Render ejecuta la imagen; funciona igual en cualquier servidor. |
| **Render** | Hosting con plan gratuito | Despliega solo desde GitHub, da HTTPS gratis. |
| **Neon** | PostgreSQL en la nube, plan gratuito | Los datos **no caducan** (la base gratis de Render se borra a los 30 días). Cumple "base de datos persistente". |
| **Expo EAS Build** | Compilación en la nube | Genera el APK instalable sin publicar en tiendas. |
| **Git + GitHub** | Control de versiones | Repositorio público con todo el código y la documentación; cada cambio entró por un Pull Request. |

---

## 4. La base de datos

Diagrama completo en [BASE_DE_DATOS.md](BASE_DE_DATOS.md). Explicado fácil:

| Tabla | Qué guarda | Relación clave |
|---|---|---|
| `roles` | admin, tecnico, usuario | Un rol tiene muchos usuarios |
| `users` | Personas que usan el sistema | Cada usuario tiene **un** rol (`rol_id`) |
| `categorias` | Tipos de equipo (Portátil, Impresora…) y tipos de solicitud (Hardware, Software…) | Columna `tipo` distingue cuál es cuál |
| `estados` | Abierta, Asignada, En proceso, Resuelta, Cerrada, Cancelada | `es_final` marca Cerrada y Cancelada |
| `equipos` | El inventario: código, marca, serial, ubicación… | `codigo_inventario` es **único** |
| `solicitudes` | Cada reporte de falla | Apunta a un equipo, una categoría, un estado, un solicitante y un técnico |
| `asignaciones` | Cada vez que se asigna o reasigna un técnico | Guarda quién asignó y cuál es la vigente (`activa`) |
| `historial` | Cada acción sobre una solicitud | Quién, cuándo, qué, estado anterior y nuevo |

Conceptos que te pueden preguntar:

- **Llave primaria (PK)**: el `id` que identifica cada fila.
- **Llave foránea (FK)**: columna que apunta al `id` de otra tabla, por ejemplo `solicitudes.equipo_id → equipos.id`. Garantiza que no exista una solicitud de un equipo que no existe.
- **Relación uno a muchos (1:N)**: un equipo puede tener muchas solicitudes; una solicitud es de un solo equipo.
- **Integridad referencial**: no se puede borrar un equipo que tiene solicitudes (la API responde 409 y sugiere darlo de baja).
- **Normalización**: los estados y categorías están en su propia tabla en vez de repetir el texto en cada solicitud; si cambia el nombre de un estado, se cambia en un solo lugar.
- **¿Por qué una tabla `asignaciones` si la solicitud ya tiene `tecnico_id`?** `tecnico_id` dice quién la tiene **ahora**; `asignaciones` guarda **todas** las asignaciones y reasignaciones, para auditoría.
- **Migraciones**: archivos PHP que crean las tablas. Con `php artisan migrate` cualquiera recrea la base idéntica.
- **Seeders**: llenan los datos iniciales (roles, estados, usuarios de prueba, 23 equipos, 5 solicitudes).

---

## 5. Inicio de sesión y roles

**Cómo funciona el login (Sanctum):**

1. La app envía correo y contraseña a `POST /api/login`.
2. Laravel busca el usuario y compara la contraseña con el **hash** guardado (las contraseñas nunca se guardan en texto plano, se usa bcrypt).
3. Si está bien y el usuario está activo, crea un **token** y lo devuelve.
4. La app guarda el token en SecureStore y lo manda en cada petición: `Authorization: Bearer 12|abc...`.
5. El middleware `auth:sanctum` lee el token y sabe quién hace la petición. Sin token: **401**.
6. Al cerrar sesión, `POST /api/logout` borra el token en el servidor.

**Roles:** se controlan **en el servidor**, no solo en la app.

| | Usuario | Técnico | Administrador |
|---|:-:|:-:|:-:|
| Crear solicitudes | ✔ | ✔ | ✔ |
| Ver solicitudes | solo las suyas | asignadas a él y suyas | todas |
| Registrar / editar equipos | | ✔ | ✔ |
| Eliminar equipos | | | ✔ |
| Asignar técnico | | | ✔ |
| Diagnóstico y cambio de estado | | si es el asignado | ✔ |
| Usuarios, categorías y estados | | | ✔ |

Dos capas de control:
1. En `routes/api.php`, el middleware `rol:admin` o `rol:admin,tecnico` bloquea rutas completas con **403**.
2. Dentro del controlador se revisan casos finos: un técnico solo puede diagnosticar **su** solicitud; un usuario solo ve **sus** solicitudes (`Solicitud::visiblesPara($user)`).

La app además **oculta** los botones que el rol no puede usar, pero eso es solo comodidad: la seguridad está en la API.

---

## 6. El ciclo de vida de una solicitud

```
Abierta ──(admin asigna)──▶ Asignada ──(técnico diagnostica)──▶ En proceso ──▶ Resuelta ──▶ Cerrada
   └────────────────────────────── Cancelada ◀──────────────────────────────┘
```

- Al crearla: **Abierta**, historial "creada".
- Al asignar: pasa a **Asignada**, se guarda la fecha y una fila en `asignaciones`.
- El técnico registra **diagnóstico** (causa) y **solución** (qué hizo), y cambia el estado.
- Al **Cerrar** o **Cancelar** se guarda la fecha de cierre y ya no se puede diagnosticar ni asignar, salvo que se reabra.
- Cada paso deja una fila en `historial`: eso es el **historial de atención** que pide la prueba.

---

## 7. Validaciones y manejo de errores

- **En la app**: revisa lo básico antes de enviar (campos vacíos, formato de correo) para dar respuesta inmediata.
- **En la API** (la que manda): reglas de Laravel en los `FormRequest`. Ejemplos: código de inventario único, título 5–150 caracteres, descripción mínimo 10, prioridad válida, fecha de adquisición no futura, el técnico debe estar activo.
- Si algo falla, la API responde **422** con `errors` por campo y la app muestra cada mensaje debajo de su campo, en español.
- Todos los errores son JSON con `message`: 401 (sin sesión), 403 (sin permiso), 404 (no existe), 409 (en uso), 429 (demasiados intentos de login), 500 (error interno, sin mostrar detalles en producción).
- Las operaciones de varias tablas usan **transacciones**: o se guarda todo o nada.

---

## 8. Despliegue: cómo llegó a internet

Detalle en [DESPLIEGUE.md](DESPLIEGUE.md). La historia:

1. **Neon**: creé la base PostgreSQL gratis y copié su cadena de conexión.
2. **Render**: conecté el repositorio de GitHub. Render lee `render.yaml`, construye la imagen con `backend/Dockerfile` (PHP 8.3 + Apache) y la arranca. Pegué la cadena de Neon en la variable secreta `DB_URL` (no está en el código).
3. Al arrancar, `docker/start.sh` ejecuta las **migraciones** y carga los datos de prueba **solo si la base está vacía**, para no borrar datos reales.
4. La API quedó en `https://galaxia-soporte-api.onrender.com`. Cada `push` a `main` la redespliega sola.
5. **Expo EAS**: `eas build -p android --profile preview` compila el APK en la nube. El perfil `preview` le dice a la app que use la URL pública.

Problema real que resolví: las migraciones fallaban con Neon porque su cadena por defecto usa un "pooler" (PgBouncer) que no soporta bien las transacciones de migración. `start.sh` quita `-pooler` del host para usar la conexión directa.

Limitación honesta: el plan gratis de Render **duerme** el servidor tras 15 minutos sin uso; la primera petición tarda 30–60 s. Por eso la app espera hasta 60 s y muestra un mensaje claro. Antes de la demo conviene abrir `/up` para despertarlo.

---

## 9. Preguntas probables y respuestas

**Generales**

1. **¿Qué hace tu sistema?** Gestiona solicitudes de soporte técnico e inventario: los usuarios reportan fallas, el administrador asigna técnicos, el técnico diagnostica y soluciona, y todo queda en un historial.
2. **¿Cuál es la arquitectura?** Cliente-servidor en tres capas: app móvil (presentación), API REST Laravel (lógica) y PostgreSQL (datos). Se comunican por HTTPS con JSON.
3. **¿Qué es una API REST?** Una interfaz por HTTP donde cada recurso tiene una URL (`/equipos`, `/solicitudes`) y se usan los métodos HTTP: GET consulta, POST crea, PUT actualiza, DELETE elimina. Es sin estado: cada petición lleva su token.
4. **¿Por qué separar app y backend?** Para que la lógica y la seguridad estén en un solo lugar, y para que mañana se pueda hacer una web o integrar otro sistema con la misma API.

**Backend y base de datos**

5. **¿Cómo validas los datos?** Con FormRequest de Laravel; si fallan responde 422 con el error de cada campo.
6. **¿Cómo evitas que un usuario haga cosas de administrador?** Con el middleware `rol` en las rutas y verificaciones en el controlador. Aunque alguien llame la API directo, recibe 403.
7. **¿Cómo guardas las contraseñas?** Con hash bcrypt; nunca en texto plano y nunca se devuelven en el JSON.
8. **¿Qué es Sanctum y por qué no sesiones?** Genera tokens para apps móviles. Una app nativa no maneja cookies de sesión como un navegador, por eso se usa token Bearer.
9. **¿Qué pasa si borro un equipo con solicitudes?** No se permite: la llave foránea lo impide y la API responde 409 sugiriendo marcarlo "dado de baja".
10. **¿Qué es una migración?** Un archivo que describe cómo crear o cambiar una tabla; permite versionar la base de datos junto con el código.
11. **¿Cómo evitas inyección SQL?** Eloquent y el query builder usan consultas con parámetros enlazados.
12. **¿Cómo pruebas el backend?** 13 pruebas automáticas con PHPUnit (`php artisan test`) que cubren login, permisos, validaciones y el flujo completo.

**App móvil**

13. **¿Cómo sabe la app a qué servidor llamar?** Por la variable `EXPO_PUBLIC_API_URL`; el APK trae la URL de Render.
14. **¿Dónde guardas el token?** En `expo-secure-store`, almacenamiento cifrado del teléfono.
15. **¿Qué pasa si el token expira o es inválido?** La API responde 401, la app borra la sesión y vuelve al login.
16. **¿Cómo manejas el estado de la sesión?** Con React Context (`AuthProvider`), que comparte el usuario con todas las pantallas.
17. **¿Cómo funciona la navegación?** Expo Router: cada archivo de `src/app/` es una pantalla; `Stack.Protected` impide entrar sin sesión.

**Despliegue**

18. **¿Dónde está desplegado?** API en Render con Docker, base de datos en Neon (PostgreSQL), APK con Expo EAS. Todo con planes gratuitos.
19. **¿Por qué Neon y no la base de Render?** La gratuita de Render se borra a los 30 días; Neon es persistente.
20. **¿Cómo se actualiza?** Cada push a `main` en GitHub redespliega Render automáticamente y las migraciones nuevas se aplican al arrancar.
21. **¿Dónde están las claves?** En variables de entorno de Render, nunca en el repositorio.
22. **¿Por qué tarda la primera vez?** El plan gratis duerme el servidor; en producción real se pagaría un plan sin suspensión.

**Mejoras y autocrítica**

23. **¿Qué mejorarías?** Pantallas de administración de usuarios en la app (la API ya lo soporta), notificaciones push al asignar, fotos de la falla, reportes PDF y código QR en cada equipo.
24. **¿Cómo escalaría?** Plan pagado sin suspensión, varias instancias detrás de un balanceador, caché con Redis y copias de seguridad automáticas de la base.

---

## 10. Consejos para el día

- Llega con la API despierta: abre https://galaxia-soporte-api.onrender.com/up 5 minutos antes.
- Ten el APK ya instalado y las cuatro cuentas a mano.
- Sigue el guion de demostración de [EVIDENCIAS.md](EVIDENCIAS.md#4-guion-para-la-demostración-en-vivo).
- Si no sabes algo, dilo con honestidad y explica cómo lo averiguarías. Vale más que inventar.
- Ten abiertos en el PC: `backend/routes/api.php`, `backend/app/Http/Controllers/Api/SolicitudController.php`, `app-movil/src/app/solicitud/[id].tsx` y el diagrama de [BASE_DE_DATOS.md](BASE_DE_DATOS.md). Son los archivos que mejor muestran el sistema.
