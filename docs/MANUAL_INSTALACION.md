# Manual de instalación

Hay tres formas de usar el sistema, de la más rápida a la más completa:

| Opción | Para quién | Qué necesita |
|---|---|---|
| A. Instalar el APK | Evaluador o usuario final | Un teléfono Android |
| B. App en Expo Go contra la API publicada | Revisar la app sin compilar | Node.js en el PC y Expo Go en el teléfono |
| C. Todo en local (backend + app) | Desarrollador | PHP 8.3+, Composer, Node.js, Git |

Los comandos están pensados para **Windows con PowerShell**. En macOS o Linux son iguales salvo donde se indica.

Credenciales de prueba (contraseña `password` para todos):

| Correo | Rol |
|---|---|
| admin@galaxia.com | Administrador |
| tecnico@galaxia.com | Técnico (Tomás) |
| tecnico2@galaxia.com | Técnica (Laura) |
| usuario@galaxia.com | Usuario |

---

## A. Instalar el APK en Android

1. Abrir en el teléfono el enlace del APK generado con Expo EAS (ver la sección "Estado actual" de [DESPLIEGUE.md](DESPLIEGUE.md)) y pulsar **Install / Descargar**.
2. Si Android lo pide, permitir **instalar aplicaciones de origen desconocido** para el navegador.
3. Abrir **Galaxia Soporte** e iniciar sesión con una de las cuentas de prueba.

La app ya apunta a la API pública `https://galaxia-soporte-api.onrender.com/api`. Si el servidor estaba dormido, el primer inicio de sesión puede tardar hasta un minuto.

---

## B. Probar la app con Expo Go (sin compilar)

### Requisitos
- **Node.js LTS** (20 o 22): https://nodejs.org. Comprobar con `node -v`.
- **Git**: https://git-scm.com/downloads. Comprobar con `git --version`.
- **Expo Go** en el teléfono (Play Store o App Store). El teléfono y el PC en la misma red Wi-Fi.

### Pasos

```powershell
git clone https://github.com/EsleiderMeza/prueba-tecnica-galaxia-seguridad.git
cd prueba-tecnica-galaxia-seguridad\app-movil
npm install
Set-Content .env "EXPO_PUBLIC_API_URL=https://galaxia-soporte-api.onrender.com/api"
npx expo start
```

Escanear el código QR con Expo Go (Android) o con la cámara (iPhone). También se puede abrir en el navegador pulsando `w` en la terminal.

---

## C. Instalación local completa

### C.1 Instalar PHP y Composer (una sola vez)

Abrir **PowerShell como administrador** (clic derecho en Inicio → "Terminal (Administrador)") y pegar:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://php.new/install/windows/8.4'))
```

Es el instalador oficial que recomienda Laravel (instala PHP y Composer). Cerrar y abrir PowerShell de nuevo (normal) y comprobar:

```powershell
php -v
composer -V
```

En macOS o Linux: `/bin/bash -c "$(curl -fsSL https://php.new/install/mac/8.4)"` o `.../install/linux/8.4`.

### C.2 Backend

```powershell
cd prueba-tecnica-galaxia-seguridad\backend
composer install
Copy-Item .env.example .env
php artisan key:generate
New-Item -ItemType File database\database.sqlite -Force
php artisan migrate --seed
php artisan serve --host=0.0.0.0 --port=8000
```

- `migrate --seed` crea las tablas y carga roles, categorías, estados, los 4 usuarios de prueba, 23 equipos y 5 solicitudes de ejemplo.
- Dejar esa ventana abierta. Si Windows pregunta por el firewall, permitir el acceso en **redes privadas**.
- Comprobar en el navegador: http://localhost:8000/api debe responder `{"nombre":"API Soporte Técnico · Galaxia Seguridad", ...}`.
- Para empezar de cero: `php artisan migrate:fresh --seed`.

**Usar PostgreSQL o MySQL en local (opcional).** En `.env` cambiar:

```
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=galaxia
DB_USERNAME=postgres
DB_PASSWORD=tu_clave
```

y volver a ejecutar `php artisan migrate --seed`.

### C.3 Pruebas automáticas del backend

```powershell
php artisan test
```

Deben pasar las 23 pruebas.

### C.4 App móvil apuntando al backend local

1. En otra ventana de PowerShell ejecutar `ipconfig` y copiar la "Dirección IPv4" (ejemplo `192.168.1.50`).
2. Configurar y arrancar la app:

```powershell
cd prueba-tecnica-galaxia-seguridad\app-movil
npm install
Set-Content .env "EXPO_PUBLIC_API_URL=http://192.168.1.50:8000/api"
npx expo start -c
```

| Dónde corre la app | URL de la API |
|---|---|
| Teléfono físico en la misma Wi-Fi | `http://IP-DEL-PC:8000/api` |
| Emulador de Android Studio | `http://10.0.2.2:8000/api` |
| Navegador del mismo PC (`w`) | `http://localhost:8000/api` |

La URL que está usando la app se ve al pie de la pantalla de login.

### C.5 Verificar la app

```powershell
npm run typecheck
npm run lint
```

---

## Generar el APK

Con una cuenta gratuita en https://expo.dev, dentro de `app-movil`:

```powershell
npx eas-cli@latest login
npx eas-cli@latest build -p android --profile preview
```

Al terminar (10 a 20 minutos) EAS muestra un enlace y un QR para descargar el APK. El perfil `preview` de `eas.json` ya apunta a la API publicada. Más detalle en [DESPLIEGUE.md](DESPLIEGUE.md).

---

## Problemas comunes

| Problema | Solución |
|---|---|
| `could not find driver` al migrar | Falta la extensión de SQLite. `php --ini` muestra qué `php.ini` se usa; quitar el `;` de `extension=pdo_sqlite` y `extension=sqlite3`. |
| `No application encryption key` | `php artisan key:generate` |
| La app dice "No se pudo conectar con el servidor" | Revisar que `php artisan serve` tenga `--host=0.0.0.0`, que la IP del `.env` sea la del PC, que ambos estén en la misma Wi-Fi y que el firewall permita PHP. Abrir `http://IP-DEL-PC:8000/api` en el navegador del teléfono. |
| Cambié el `.env` y no hace efecto | Detener Expo y ejecutar `npx expo start -c` |
| "El servidor tardó demasiado en responder" con la API publicada | Render estaba dormido. Esperar unos segundos y reintentar. |
| Red de la empresa que bloquea el QR | `npx expo start --tunnel` |
