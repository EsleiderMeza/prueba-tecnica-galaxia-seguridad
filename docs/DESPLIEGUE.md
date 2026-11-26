# Despliegue gratuito

La solución se publica con tres servicios que tienen plan gratuito:

| Parte | Servicio | Para qué |
|---|---|---|
| Base de datos | [Neon](https://neon.tech) | PostgreSQL administrado, gratis y persistente (no caduca). |
| API Laravel | [Render](https://render.com) | Servidor web con Docker, HTTPS incluido, se redespliega solo con cada push a `main`. |
| App móvil | [Expo EAS](https://expo.dev) | Compila el APK de Android en la nube. |

```
App Android (APK)  ──HTTPS──▶  Render (Docker: PHP 8.3 + Apache + Laravel)  ──SSL──▶  Neon (PostgreSQL)
```

## Archivos del repositorio que intervienen

- `render.yaml`: blueprint de Render. Crea el servicio web `galaxia-soporte-api` en plan gratuito, con la carpeta `backend/` como raíz y todas las variables de entorno.
- `backend/Dockerfile`: imagen de producción (PHP 8.3 + Apache, extensiones `pdo_pgsql`, `zip`, `intl`, `opcache`; dependencias con `composer install --no-dev`).
- `backend/docker/start.sh`: al arrancar el contenedor ajusta el puerto que da Render, cachea la configuración, ejecuta `php artisan migrate --force` y carga los datos de prueba **solo si la base está vacía** (`php artisan app:seed-if-empty`).
- `app-movil/eas.json`: perfil `preview` que genera un APK instalable con la URL pública de la API.

## Variables de entorno del backend

| Variable | Valor | Origen |
|---|---|---|
| `APP_KEY` | generada por Render | `render.yaml` (`generateValue`). `start.sh` le agrega el prefijo `base64:`. |
| `APP_ENV` / `APP_DEBUG` | `production` / `false` | `render.yaml` |
| `DB_CONNECTION` | `pgsql` | `render.yaml` |
| `DB_URL` | cadena de conexión de Neon | se pega a mano en Render (secreta, no está en el repositorio) |
| `DB_SSLMODE` | `require` | `render.yaml` |
| `LOG_CHANNEL` | `stderr` | `render.yaml` (los logs se ven en el panel de Render) |
| `SESSION_DRIVER` / `CACHE_STORE` / `QUEUE_CONNECTION` | `array` / `database` / `sync` | `render.yaml` |

## Paso a paso

### 1. Base de datos en Neon
1. Crear cuenta en https://neon.tech (con GitHub).
2. Crear el proyecto `galaxia-soporte` (región AWS US East).
3. En **Connect**, copiar la cadena de conexión (`postgresql://usuario:clave@host/neondb?sslmode=require`).

### 2. API en Render
1. Crear cuenta en https://render.com (con GitHub) y dar acceso al repositorio.
2. **New → Blueprint**, elegir el repositorio y la rama `main`. Render lee `render.yaml`.
3. Cuando pida `DB_URL`, pegar la cadena de Neon y pulsar **Apply**.
4. Esperar el primer despliegue (5 a 10 minutos). Al terminar, la URL queda como `https://galaxia-soporte-api.onrender.com` (URL actual del proyecto).
5. Comprobar: abrir `https://<url>/up` (debe responder 200).

Las migraciones y los datos de prueba se ejecutan solos. Usuarios de prueba (clave `password`): `admin@galaxia.com`, `tecnico@galaxia.com`, `tecnico2@galaxia.com`, `usuario@galaxia.com`.

### 3. APK con Expo EAS
1. Crear cuenta en https://expo.dev.
2. `app-movil/eas.json` (perfiles `preview` y `production`) ya apunta a `https://galaxia-soporte-api.onrender.com/api`.
3. En PowerShell, dentro de `app-movil`:
   ```powershell
   npm install
   npx eas-cli@latest login
   npx eas-cli@latest build -p android --profile preview
   ```
4. Al terminar, EAS muestra un enlace y un código QR para descargar el APK.

## Limitaciones del plan gratuito

- Render apaga el servidor tras 15 minutos sin uso. La primera petición después de eso tarda entre 30 y 60 segundos; la app espera hasta 60 segundos antes de mostrar un error.
- Neon suspende el cómputo sin uso y lo reactiva en menos de un segundo; los datos se conservan.
- Render da 750 horas gratis al mes por cuenta, suficiente para un servicio encendido todo el mes.

## Problemas conocidos

- **Migraciones fallan con `SQLSTATE[25P02] ... current transaction is aborted` usando Neon.** La cadena que da Neon por defecto apunta al host con `-pooler` (PgBouncer en modo transacción), que no funciona bien con las migraciones de Laravel. `start.sh` quita `-pooler` del host automáticamente para usar la conexión directa, así que se puede pegar la cadena tal cual la da Neon.

## Actualizar
Cada push a `main` redespliega la API automáticamente. Las migraciones nuevas se aplican al arrancar.
