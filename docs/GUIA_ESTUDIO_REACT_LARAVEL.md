# Guía de estudio: React Native y Laravel

Esta guía enseña los conceptos básicos de **React Native** y **Laravel** usando como ejemplo el código de este mismo proyecto. Así, cuando en la sustentación te pregunten "¿qué es un hook?" o "¿qué hace un middleware?", puedes responder y además mostrar dónde lo usaste.

Cómo estudiarla:
1. Lee cada concepto y abre el archivo que se menciona para verlo en el código real.
2. Al final de cada parte hay un banco de preguntas. Tapa la respuesta, contesta en voz alta y luego compara.
3. Complementa con [GUIA_SUSTENTACION.md](GUIA_SUSTENTACION.md), que explica la arquitectura y el despliegue.

---

# Parte 1. React Native

## 1.1 ¿Qué es React Native?

**React** es una librería de JavaScript para construir interfaces a partir de **componentes**. **React Native** usa la misma idea, pero en lugar de dibujar HTML en un navegador dibuja **componentes nativos** de Android e iOS. Se escribe una vez en JavaScript/TypeScript y funciona en ambos sistemas.

| En la web (HTML) | En React Native |
|---|---|
| `<div>` | `<View>` |
| `<p>`, `<span>` | `<Text>` |
| `<input>` | `<TextInput>` |
| `<button>` | `<Pressable>` / `<Button>` |
| `<ul>` con muchos `<li>` | `<FlatList>` |
| CSS | Objeto `style` (con Flexbox) |

## 1.2 Expo

**Expo** es un conjunto de herramientas encima de React Native que facilita todo:
- `npx expo start` levanta el proyecto y muestra un QR; con la app **Expo Go** se ve en el teléfono al instante.
- Trae librerías listas (`expo-secure-store`, `expo-router`, íconos).
- **EAS Build** compila el APK en la nube, sin instalar Android Studio.

Archivos: `app-movil/package.json` (dependencias), `app-movil/app.json` (nombre, ícono, paquete Android), `app-movil/eas.json` (perfiles de compilación).

## 1.3 Componentes

Un **componente** es una función que devuelve lo que se ve en pantalla. Se escribe con **JSX**, una sintaxis parecida a HTML dentro de JavaScript.

```tsx
// app-movil/src/app/login.tsx (resumido)
export default function LoginScreen() {
  return (
    <View>
      <Text>Iniciar sesión</Text>
      <Field label="Correo electrónico" ... />
      <Button title="Ingresar" onPress={submit} />
    </View>
  );
}
```

Los componentes se **reutilizan**: `Button`, `Field`, `Card`, `Badge` están definidos una vez en `src/components/ui.tsx` y se usan en todas las pantallas.

## 1.4 Props

Las **props** son los datos que un componente padre le pasa a un hijo, como los parámetros de una función. Son de **solo lectura** para el hijo.

```tsx
// Definición (src/components/ui.tsx)
export function Button({ title, onPress, loading, variant = 'primary', icon }) { ... }

// Uso (src/app/solicitud/[id].tsx)
<Button title="Guardar diagnóstico" icon="save-outline" onPress={guardar} loading={saving} />
```

`title`, `icon`, `onPress` y `loading` son props. El mismo botón muestra textos distintos según las props que recibe.

## 1.5 Estado (`useState`)

El **estado** son los datos que cambian mientras la pantalla está abierta. Cuando el estado cambia, React **vuelve a dibujar** el componente automáticamente.

```tsx
// src/app/login.tsx
const [email, setEmail] = useState('');       // valor inicial: vacío
const [loading, setLoading] = useState(false);

<Field value={email} onChangeText={setEmail} />  // cada letra actualiza el estado
<Button loading={loading} ... />                 // el botón muestra "cargando" si loading es true
```

- `email` es el valor actual; `setEmail` es la función para cambiarlo.
- Diferencia clave: **props vienen de afuera, estado es interno** del componente.

## 1.6 Hooks

Los **hooks** son funciones especiales de React que empiezan por `use`. Permiten a un componente funcional tener estado, efectos y más. Reglas: se llaman siempre en el nivel superior del componente (no dentro de `if` ni bucles).

| Hook | Para qué | Dónde se usa |
|---|---|---|
| `useState` | Guardar estado | Todos los formularios |
| `useEffect` | Ejecutar algo **después** de dibujar o cuando cambia un valor (llamar la API, temporizadores) | `src/context/auth.tsx` restaura la sesión al abrir la app; `equipos.tsx` espera 400 ms antes de buscar |
| `useContext` | Leer datos compartidos globalmente | `useAuth()` en `src/context/auth.tsx` |
| `useCallback` / `useMemo` | Evitar recrear funciones o valores en cada dibujo | `auth.tsx` |
| `useRef` | Guardar un valor que no provoca redibujo | `utils/useApi.ts` |
| Hooks propios | Reutilizar lógica | `useApi`, `usePaginated`, `useAuth` |

Ejemplo de `useEffect` con limpieza (búsqueda con retraso, "debounce"):

```tsx
// src/app/(tabs)/equipos.tsx
useEffect(() => {
  const t = setTimeout(() => setDebounced(search.trim()), 400);
  return () => clearTimeout(t);   // si el usuario sigue escribiendo, se cancela el anterior
}, [search]);                     // se ejecuta cada vez que cambia "search"
```

Así no se llama la API con cada letra, sino cuando el usuario deja de escribir.

**Hook propio** `useApi` (`src/utils/useApi.ts`): encapsula "llamar la API, guardar datos, error y si está cargando, y recargar al volver a la pantalla". Cualquier pantalla lo usa en una línea.

## 1.7 Context (estado global)

Pasar el usuario conectado por props a todas las pantallas sería tedioso. **Context** permite compartir datos con todo el árbol de componentes.

```tsx
// src/app/_layout.tsx
<AuthProvider>          {/* envuelve toda la app */}
  <RootNavigator />
</AuthProvider>

// En cualquier pantalla
const { user, login, logout, hasRole } = useAuth();
{hasRole('admin', 'tecnico') && <Button title="Editar equipo" ... />}
```

`AuthProvider` (en `src/context/auth.tsx`) guarda el usuario, hace login y logout, y ofrece `hasRole()` para mostrar u ocultar botones según el rol.

## 1.8 Navegación (Expo Router)

Expo Router usa **rutas por archivos**: cada archivo dentro de `src/app/` es una pantalla.

| Archivo | Ruta |
|---|---|
| `login.tsx` | `/login` |
| `(tabs)/equipos.tsx` | `/equipos` (pestaña) |
| `equipo/[id].tsx` | `/equipo/5` → `[id]` es un **parámetro dinámico** |
| `solicitud/nueva.tsx` | `/solicitud/nueva` |

- `_layout.tsx` define cómo se agrupan las pantallas: un **Stack** (pantallas apiladas con botón "atrás") y **Tabs** (pestañas inferiores).
- Se navega con `router.push('/equipo/5')`.
- El parámetro se lee con `useLocalSearchParams()`.
- **Rutas protegidas**: en `_layout.tsx`, `Stack.Protected guard={!!user}` solo deja entrar a las pestañas si hay sesión; si no, muestra el login.

## 1.9 Listas (`FlatList`)

`FlatList` dibuja solo los elementos visibles, así una lista de miles de equipos no pone lenta la app. Se usa en Equipos, Solicitudes e Historial con:
- `onEndReached`: cargar la siguiente página al llegar al final (paginación infinita, `utils/usePaginated.ts`).
- `RefreshControl`: deslizar hacia abajo para recargar.

## 1.10 Estilos

Se escriben como objetos JavaScript, con **Flexbox** para ubicar elementos (`flexDirection`, `justifyContent`, `alignItems`). Los colores y espacios están centralizados en `src/theme.ts` para que toda la app se vea igual.

## 1.11 Comunicación con la API (`fetch`)

`src/api/client.ts` usa `fetch`, la función estándar para hacer peticiones HTTP:

```ts
response = await fetch(url, {
  method,                                       // GET, POST, PUT, DELETE
  headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify(datos),
});
```

- `async` / `await`: esperan la respuesta sin congelar la app (programación **asíncrona**).
- `try / catch`: captura errores de red.
- Si la respuesta no es correcta (`!response.ok`), se crea un `ApiError` con el mensaje y los errores por campo que envía Laravel.
- Si llega **401**, se cierra la sesión automáticamente.
- Hay un **tiempo límite de 60 s** (por el servidor gratuito que se duerme).

`src/api/endpoints.ts` tiene una función por ruta (`EquiposApi.list`, `SolicitudesApi.asignar`…), así las pantallas no repiten URLs.

## 1.12 TypeScript

TypeScript agrega **tipos** a JavaScript. En `src/api/types.ts` está definido cómo es un `Equipo`, una `Solicitud`, etc. Si escribo `equipo.codgo` (mal escrito), el editor marca el error antes de ejecutar. `npm run typecheck` revisa todo el proyecto.

## 1.13 Almacenamiento seguro

El token de sesión se guarda con `expo-secure-store`, que usa el almacenamiento cifrado del sistema (Keystore en Android). Así, al cerrar y abrir la app, la sesión sigue activa sin guardar la contraseña.

---

## Banco de preguntas: React Native

1. **¿Qué es React Native?** — Un framework para crear apps móviles nativas para Android e iOS con JavaScript/TypeScript usando componentes de React.
2. **¿Diferencia entre React y React Native?** — React dibuja HTML en el navegador; React Native dibuja componentes nativos del teléfono (`View`, `Text`) en lugar de `div` o `p`.
3. **¿Qué es Expo y por qué lo usaste?** — Herramientas sobre React Native que permiten probar con Expo Go y compilar el APK en la nube con EAS, sin configurar Android Studio.
4. **¿Qué es un componente?** — Una función que devuelve la interfaz (JSX). Ejemplo: `LoginScreen` o el `Button` reutilizable.
5. **¿Qué es JSX?** — Sintaxis parecida a HTML dentro de JavaScript para describir la interfaz.
6. **¿Qué son las props?** — Datos que el padre pasa al hijo; el hijo no los modifica. Ejemplo: `<Button title="Asignar" />`.
7. **¿Qué es el estado?** — Datos internos que cambian; al cambiar, el componente se vuelve a dibujar. Se crea con `useState`.
8. **¿Diferencia entre props y estado?** — Props vienen de afuera y son de solo lectura; el estado es propio y se cambia con su función `set`.
9. **¿Qué es un hook?** — Función de React que empieza con `use` y da capacidades a los componentes (estado, efectos, contexto).
10. **¿Para qué sirve `useEffect`?** — Para efectos secundarios después de dibujar: llamar la API, temporizadores, suscripciones. El arreglo de dependencias indica cuándo repetirlo.
11. **¿Qué pasa si `useEffect` tiene el arreglo vacío `[]`?** — Se ejecuta una sola vez, al montar el componente.
12. **¿Qué es Context y dónde lo usaste?** — Una forma de compartir datos globales sin pasar props. Lo usé para la sesión (`AuthProvider` / `useAuth`).
13. **¿Cómo funciona la navegación?** — Con Expo Router: cada archivo de `src/app` es una pantalla; uso Stack y Tabs, y `router.push` para navegar.
14. **¿Cómo proteges pantallas para que no entren sin login?** — Con `Stack.Protected` en `_layout.tsx`, que depende de si hay usuario en el contexto.
15. **¿Cómo se conecta la app con la API?** — Con `fetch` en `src/api/client.ts`, enviando JSON y el token en la cabecera `Authorization: Bearer`.
16. **¿Qué es async/await?** — Forma de escribir código asíncrono: `await` espera una promesa (por ejemplo la respuesta del servidor) sin bloquear la app.
17. **¿Dónde guardas el token y por qué ahí?** — En `expo-secure-store`, porque está cifrado; no en texto plano.
18. **¿Cómo muestras los errores de validación del backend?** — La API responde 422 con `errors` por campo; `ApiError.field('codigo_inventario')` toma el mensaje y el `Field` lo muestra debajo.
19. **¿Por qué `FlatList` y no un `ScrollView` con `map`?** — `FlatList` solo dibuja lo visible y permite paginación, mejor rendimiento con muchas filas.
20. **¿Qué ventaja te dio TypeScript?** — Detecta errores de tipos antes de ejecutar y documenta la forma de los datos de la API.
21. **¿Cómo cambias la URL de la API?** — Con `EXPO_PUBLIC_API_URL` en `.env` o en el perfil de `eas.json`.
22. **¿Cómo generaste el APK?** — `npx eas-cli build -p android --profile preview` (compila en la nube de Expo).
23. **¿La app oculta botones según el rol; eso es seguridad?** — No, es comodidad. La seguridad real la hace la API, que responde 403.

---

# Parte 2. Laravel

## 2.1 ¿Qué es Laravel?

Un **framework de PHP** para construir aplicaciones web y APIs. Trae resuelto lo común: rutas, conexión a base de datos, validación, autenticación, manejo de errores y pruebas. Se maneja con la herramienta de consola **Artisan** (`php artisan ...`) y sus dependencias con **Composer** (`composer install`).

## 2.2 MVC

Laravel organiza el código con el patrón **Modelo–Vista–Controlador**:

| Parte | Qué hace | En este proyecto |
|---|---|---|
| **Modelo** | Representa una tabla y sus relaciones | `app/Models/Equipo.php`, `Solicitud.php`… |
| **Vista** | Lo que se devuelve al cliente | En una API son los **Resources** que arman el JSON (`app/Http/Resources/`) |
| **Controlador** | Recibe la petición, aplica la lógica y responde | `app/Http/Controllers/Api/EquipoController.php`… |

Recorrido de una petición:

```
Ruta → Middleware → Validación (FormRequest) → Controlador → Modelo → BD → Resource (JSON)
```

## 2.3 Rutas

En `routes/api.php` se define qué URL y método HTTP llama a qué función de qué controlador. Todo lo de ese archivo lleva el prefijo `/api`.

```php
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/equipos', [EquipoController::class, 'index']);          // listar
    Route::get('/equipos/{equipo}', [EquipoController::class, 'show']);   // ver uno
    Route::middleware('rol:admin,tecnico')->group(function () {
        Route::post('/equipos', [EquipoController::class, 'store']);      // crear
        Route::put('/equipos/{equipo}', [EquipoController::class, 'update']);
    });
});
```

- `{equipo}` es un parámetro. Gracias al **Route Model Binding**, Laravel busca el equipo con ese id y lo entrega al controlador como objeto `Equipo`; si no existe, responde 404 automáticamente.
- `group` aplica un middleware a varias rutas a la vez.
- `php artisan route:list` muestra todas las rutas.

## 2.4 Controladores

Clases con un método por acción. Convención REST: `index` (listar), `store` (crear), `show` (ver), `update` (actualizar), `destroy` (eliminar).

```php
// app/Http/Controllers/Api/EquipoController.php
public function store(EquipoRequest $request)
{
    $equipo = Equipo::create($request->validated());   // solo los datos ya validados
    return (new EquipoResource($equipo->load('categoria')))
        ->response()->setStatusCode(201);               // 201 = creado
}
```

## 2.5 Modelos y Eloquent (ORM)

**Eloquent** es el ORM de Laravel: permite trabajar con la base de datos usando objetos PHP en lugar de escribir SQL.

```php
Equipo::create([...]);                  // INSERT
Equipo::find(5);                        // SELECT ... WHERE id = 5
$equipo->update([...]);                 // UPDATE
$equipo->delete();                      // DELETE
Equipo::where('estado', 'operativo')->paginate(10);
```

En el modelo se declara:
- `$fillable`: qué campos se pueden llenar de forma masiva (protección contra *mass assignment*).
- `$hidden`: campos que no salen en el JSON (por ejemplo `password` en `User`).
- `casts()`: conversión de tipos (`'password' => 'hashed'` guarda la clave con hash automáticamente; `'activo' => 'boolean'`).

## 2.6 Relaciones

```php
// app/Models/Equipo.php
public function categoria(): BelongsTo { return $this->belongsTo(Categoria::class); }  // el equipo pertenece a una categoría
public function solicitudes(): HasMany { return $this->hasMany(Solicitud::class); }    // el equipo tiene muchas solicitudes

// app/Models/Solicitud.php
public function tecnico(): BelongsTo { return $this->belongsTo(User::class, 'tecnico_id'); }
public function historial(): HasMany { return $this->hasMany(Historial::class); }
```

| Relación | Significa | Ejemplo |
|---|---|---|
| `belongsTo` | "pertenece a" (la tabla tiene la llave foránea) | Solicitud → Equipo |
| `hasMany` | "tiene muchos" | Equipo → Solicitudes |
| (1:N en la BD) | Un registro se relaciona con muchos del otro lado | Rol → Usuarios |

**Eager loading** con `with()`: `Solicitud::with(['equipo', 'estado', 'tecnico'])` trae las relaciones en pocas consultas en vez de una por fila (evita el problema **N+1**).

**Scopes**: consultas reutilizables. `Solicitud::visiblesPara($user)` devuelve solo lo que ese usuario puede ver según su rol.

## 2.7 Migraciones

Archivos que crean o modifican tablas con código PHP. Son el "control de versiones" de la base de datos.

```php
// database/migrations/2026_11_26_000002_create_equipos_table.php
Schema::create('equipos', function (Blueprint $table) {
    $table->id();                                                     // PK autoincremental
    $table->string('codigo_inventario', 50)->unique();                // único
    $table->foreignId('categoria_id')->constrained('categorias')->restrictOnDelete(); // FK
    $table->string('estado', 30)->default('operativo')->index();
    $table->date('fecha_adquisicion')->nullable();
    $table->timestamps();                                             // created_at y updated_at
});
```

| Comando | Qué hace |
|---|---|
| `php artisan migrate` | Ejecuta las migraciones pendientes |
| `php artisan migrate:fresh --seed` | Borra todo, recrea las tablas y carga datos |
| `php artisan make:migration create_x_table` | Crea una migración nueva |

`restrictOnDelete()` impide borrar una categoría si hay equipos que la usan (integridad referencial).

## 2.8 Seeders

Llenan la base con datos iniciales. `database/seeders/`:
- `CatalogoSeeder`: roles, categorías y estados.
- `UsuarioSeeder`: los 4 usuarios de prueba.
- `DemoSeeder`: 23 equipos y 5 solicitudes con historial.

Se ejecutan con `php artisan db:seed` o junto con `migrate --seed`.

## 2.9 Validación

Laravel valida con reglas declarativas. Para formularios grandes se usa un **FormRequest**:

```php
// app/Http/Requests/EquipoRequest.php
return [
    'codigo_inventario' => ['required', 'string', 'max:50', Rule::unique('equipos', 'codigo_inventario')->ignore($id)],
    'nombre'            => ['required', 'string', 'max:120'],
    'categoria_id'      => ['required', 'integer', Rule::exists('categorias', 'id')->where('tipo', 'equipo')],
    'estado'            => ['required', Rule::in(Equipo::ESTADOS)],
    'fecha_adquisicion' => ['nullable', 'date', 'before_or_equal:today'],
];
```

Si una regla falla, Laravel **detiene** la petición antes del controlador y responde **422** con los errores por campo. Los mensajes están en español (`lang/es/` y el método `messages()`).

## 2.10 Middleware

Un **middleware** es un filtro que se ejecuta **antes** de llegar al controlador. Puede dejar pasar la petición o cortarla.

| Middleware | Qué hace |
|---|---|
| `auth:sanctum` | Exige un token válido; si no, 401 |
| `throttle:10,1` | Máximo 10 intentos de login por minuto; si no, 429 |
| `rol:admin,tecnico` | Propio del proyecto: exige uno de esos roles; si no, 403 |

```php
// app/Http/Middleware/VerificarRol.php
public function handle(Request $request, Closure $next, string ...$roles)
{
    $user = $request->user();
    if (! $user || ! $user->tieneRol(...$roles)) {
        return response()->json(['message' => 'No tienes permiso para realizar esta acción.'], 403);
    }
    return $next($request);   // deja continuar
}
```

Se registra con el alias `rol` en `bootstrap/app.php`.

## 2.11 Autenticación con Sanctum

1. El modelo `User` usa el trait `HasApiTokens`.
2. En el login (`AuthController@login`) se verifica la clave con `Hash::check()` y se crea un token con `$user->createToken('app-movil')->plainTextToken`.
3. El token se guarda (con hash) en la tabla `personal_access_tokens`.
4. En cada petición, `auth:sanctum` busca el token de la cabecera `Authorization: Bearer` y carga el usuario en `$request->user()`.
5. Logout: `$request->user()->currentAccessToken()->delete()`.

## 2.12 API Resources

Transforman un modelo en JSON y controlan exactamente qué campos se envían (`app/Http/Resources/EquipoResource.php`). Ventajas: no se filtran datos sensibles y el formato es estable aunque cambie la tabla. Las colecciones paginadas agregan `meta` (página actual, total…).

## 2.13 Manejo de errores

En `bootstrap/app.php` se centraliza: cualquier excepción en `/api/*` se convierte en JSON con `message` y el código correcto (401, 403, 404, 409, 422, 429, 500). En producción (`APP_DEBUG=false`) los 500 no muestran detalles internos.

## 2.14 Transacciones

```php
DB::transaction(function () {
    // crear la solicitud
    // registrar en el historial
});
```

Si algo falla a mitad, se deshace todo. Así nunca queda una solicitud sin su fila de historial.

## 2.15 Archivo `.env` y configuración

El `.env` guarda la configuración que cambia según el entorno: conexión a la base de datos, `APP_KEY`, `APP_DEBUG`. No se sube al repositorio. En Render los valores se ponen como variables de entorno.

## 2.16 Pruebas

`tests/Feature/ApiTest.php` simula peticiones a la API y comprueba las respuestas:

```php
$this->postJson('/api/login', ['email' => 'admin@galaxia.com', 'password' => 'mala'])
     ->assertStatus(422);
```

`php artisan test` → 13 pruebas, 133 verificaciones, todas correctas.

---

## Banco de preguntas: Laravel

1. **¿Qué es Laravel?** — Un framework de PHP para construir aplicaciones web y APIs, con rutas, ORM, validación, autenticación y pruebas incluidas.
2. **¿Qué es MVC?** — Patrón que separa Modelo (datos), Vista (presentación, aquí el JSON) y Controlador (lógica que une ambos).
3. **¿Dónde defines las rutas de la API?** — En `routes/api.php`; todas llevan el prefijo `/api`.
4. **¿Qué es Route Model Binding?** — Laravel convierte `{equipo}` de la URL en el objeto `Equipo` de la base; si no existe, responde 404.
5. **¿Qué es Eloquent?** — El ORM de Laravel: trabajar con tablas como objetos PHP (`Equipo::create`, `->update`, `->delete`).
6. **¿Qué es un ORM?** — Herramienta que mapea tablas a clases y filas a objetos, para no escribir SQL a mano.
7. **¿Qué es `$fillable`?** — Lista de campos que se pueden asignar en masa; protege de que alguien envíe campos que no debe (por ejemplo `rol_id`).
8. **¿Diferencia entre `belongsTo` y `hasMany`?** — `belongsTo` se usa en el modelo que tiene la llave foránea (Solicitud pertenece a Equipo); `hasMany` en el otro lado (Equipo tiene muchas Solicitudes).
9. **¿Qué es el problema N+1 y cómo lo evitas?** — Hacer una consulta extra por cada fila para traer su relación. Se evita con eager loading: `with('categoria')`.
10. **¿Qué es una migración?** — Un archivo PHP que crea o modifica tablas; permite recrear la base igual en cualquier entorno con `php artisan migrate`.
11. **¿Qué es un seeder?** — Clase que inserta datos iniciales o de prueba.
12. **¿Cómo validas los datos?** — Con FormRequest (`EquipoRequest`) o `$request->validate()`; si falla, 422 con errores por campo.
13. **¿Cómo garantizas que el código de inventario no se repita?** — Con la regla `unique` en la validación y el índice `unique()` en la migración (doble protección).
14. **¿Qué es un middleware?** — Filtro que se ejecuta antes del controlador. Uso `auth:sanctum`, `throttle` y mi propio `rol`.
15. **¿Cómo funciona Sanctum?** — Crea tokens personales en el login; el cliente los envía como `Bearer` y el middleware identifica al usuario.
16. **¿Por qué token y no sesión con cookies?** — Una app móvil nativa no maneja cookies de navegador; el token es simple y sin estado.
17. **¿Cómo guarda Laravel las contraseñas?** — Con hash bcrypt (cast `hashed` en el modelo); se verifican con `Hash::check`.
18. **¿Qué es un API Resource?** — Clase que transforma el modelo en JSON y decide qué campos se exponen.
19. **¿Qué código HTTP devuelves al crear?** — 201 Created. Al eliminar, 204 No Content.
20. **¿Qué significan 401, 403, 404, 422?** — 401 no autenticado, 403 sin permiso, 404 no existe, 422 datos inválidos.
21. **¿Qué es una transacción y dónde la usas?** — Un grupo de operaciones que se guardan todas o ninguna. La uso al crear, asignar y diagnosticar solicitudes.
22. **¿Qué es Artisan?** — La consola de Laravel: `migrate`, `db:seed`, `serve`, `test`, `route:list`, `make:model`…
23. **¿Qué es Composer?** — El gestor de dependencias de PHP; `composer install` descarga Laravel y sus paquetes.
24. **¿Qué hay en el `.env`?** — Configuración por entorno: base de datos, `APP_KEY`, modo debug. No se sube a Git.
25. **¿Cómo cambias de SQLite a PostgreSQL?** — Solo cambiando `DB_CONNECTION` y los datos de conexión en el `.env`; el código y las migraciones son los mismos.
26. **¿Cómo pruebas la API?** — Con pruebas Feature de PHPUnit (`php artisan test`) y manualmente con PowerShell, curl o Postman.
27. **¿Cómo evitas inyección SQL?** — Eloquent usa consultas preparadas con parámetros enlazados; incluso en `whereRaw` paso los valores como `?`.
28. **¿Dónde está la lógica del flujo de solicitudes?** — En `SolicitudController`: `store`, `asignar`, `diagnostico`, `cambiarEstado`, cada una registra en el historial.

---

## Comandos que conviene saber de memoria

| Comando | Para qué |
|---|---|
| `composer install` | Instalar dependencias del backend |
| `php artisan migrate --seed` | Crear tablas y datos de prueba |
| `php artisan serve --host=0.0.0.0 --port=8000` | Levantar la API en local |
| `php artisan route:list` | Ver todas las rutas |
| `php artisan test` | Ejecutar las pruebas |
| `npm install` | Instalar dependencias de la app |
| `npx expo start` | Levantar la app y ver el QR |
| `npx eas-cli build -p android --profile preview` | Generar el APK |
| `git add . ; git commit -m "..." ; git push` | Guardar y subir cambios |
