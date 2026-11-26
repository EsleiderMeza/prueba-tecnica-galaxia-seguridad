# Backend · API REST Laravel

API del sistema de soporte técnico e inventario de Galaxia Seguridad.

- **Laravel 13** (PHP 8.3 o superior) con **Sanctum** (token Bearer).
- Base de datos relacional: **SQLite** para trabajar en local (no hay que instalar nada más) y **PostgreSQL** o MySQL en el despliegue. Solo cambia el archivo `.env`.
- Sigue el contrato de la app móvil: [`app-movil/docs/API_CONTRACT.md`](../app-movil/docs/API_CONTRACT.md).
- Referencia de rutas: [`docs/API.md`](../docs/API.md). Modelo de datos: [`docs/BASE_DE_DATOS.md`](../docs/BASE_DE_DATOS.md).

## Usuarios de prueba

Contraseña de todos: `password`

| Correo | Rol |
|---|---|
| admin@galaxia.com | Administrador |
| tecnico@galaxia.com | Técnico |
| tecnico2@galaxia.com | Técnico |
| usuario@galaxia.com | Usuario |

## Ponerlo a funcionar en Windows (PowerShell)

### 1. Instalar PHP y Composer (una sola vez)

Abre **PowerShell como administrador** (clic derecho en Inicio → "Terminal (Administrador)") y pega:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://php.new/install/windows/8.4'))
```

Es el instalador oficial que recomienda Laravel: instala PHP 8.4 y Composer. **Cierra y vuelve a abrir PowerShell** (normal, no hace falta administrador) y comprueba:

```powershell
php -v
composer -V
```

### 2. Instalar el backend

```powershell
cd $HOME\prueba-tecnica-galaxia-seguridad\backend   # la carpeta donde clonaste el repo
composer install
Copy-Item .env.example .env
php artisan key:generate
New-Item -ItemType File database\database.sqlite -Force
php artisan migrate --seed
```

`migrate --seed` crea todas las tablas y carga usuarios, categorías, estados, 23 equipos y 5 solicitudes de ejemplo.
Para borrar todo y empezar de cero: `php artisan migrate:fresh --seed`.

### 3. Arrancar la API

```powershell
php artisan serve --host=0.0.0.0 --port=8000
```

Deja esa ventana abierta. Si Windows pregunta por el firewall, permite el acceso en **redes privadas**.
Abre http://localhost:8000/api en el navegador: debe responder `{"nombre":"API Soporte Técnico · Galaxia Seguridad", ...}`.

### 4. Conectar la app móvil

1. En otra ventana de PowerShell ejecuta `ipconfig` y copia la "Dirección IPv4" (por ejemplo `192.168.1.50`).
2. Edita `app-movil\.env` para que apunte al puerto 8000 de Laravel:
   ```
   EXPO_PUBLIC_API_URL=http://192.168.1.50:8000/api
   ```
3. Reinicia la app limpiando caché: `cd ..\app-movil` y `npx expo start -c`.

Ya no necesitas `mock-api`.

## Probar rápido desde PowerShell

```powershell
$r = Invoke-RestMethod -Method Post -Uri http://localhost:8000/api/login -ContentType 'application/json' -Body '{"email":"admin@galaxia.com","password":"password","device_name":"pc"}'
$h = @{ Authorization = "Bearer $($r.token)"; Accept = 'application/json' }
Invoke-RestMethod -Uri http://localhost:8000/api/dashboard -Headers $h | ConvertTo-Json -Depth 5
```

## Pruebas automáticas

```powershell
php artisan test
```

## Estructura

| Carpeta | Contenido |
|---|---|
| `routes/api.php` | Todas las rutas y qué rol puede usar cada una |
| `app/Http/Controllers/Api` | Lógica de cada recurso |
| `app/Http/Requests` | Validaciones de equipos, solicitudes y usuarios |
| `app/Http/Resources` | Forma del JSON que recibe la app |
| `app/Http/Middleware/VerificarRol.php` | Permisos por rol (`rol:admin,tecnico`) |
| `app/Models` | Modelos y relaciones |
| `database/migrations` | Tablas y llaves foráneas |
| `database/seeders` | Datos iniciales y de demostración |
| `bootstrap/app.php` | Manejo de errores: todo error responde JSON con `message` |
| `lang/es` | Mensajes de validación en español |

## Problemas comunes

- **`could not find driver`**: falta la extensión de SQLite. Ejecuta `php --ini` para ver qué `php.ini` usa y quita el `;` de las líneas `extension=pdo_sqlite` y `extension=sqlite3`.
- **La app dice "No se pudo conectar con el servidor"**: revisa que `php artisan serve` se haya iniciado con `--host=0.0.0.0`, que la IP del `.env` sea la del PC y que el teléfono esté en la misma Wi-Fi. Abre `http://TU_IP:8000/api` en el navegador del teléfono.
- **`No application encryption key`**: ejecuta `php artisan key:generate`.
