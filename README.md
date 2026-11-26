# Prueba técnica · Galaxia Seguridad

Sistema de gestión de soporte técnico e inventario tecnológico.

| Carpeta | Contenido | Estado |
|---|---|---|
| [`app-movil/`](app-movil/) | App React Native (Expo SDK 58, TypeScript) | Primera versión completa |
| [`mock-api/`](mock-api/) | API simulada en memoria, solo para desarrollo de la app (ya no es necesaria) | Lista |
| [`backend/`](backend/) | API REST Laravel 13 + Sanctum, SQLite en local / PostgreSQL en producción | Completa, con pruebas |
| [`docs/`](docs/) | Evidencias y documentación | En progreso |

El contrato entre la app y el backend está en [`app-movil/docs/API_CONTRACT.md`](app-movil/docs/API_CONTRACT.md).

**Para usar la app con el backend real (Laravel)** sigue [`backend/README.md`](backend/README.md): instalar PHP y Composer, `composer install`, `php artisan migrate --seed`, `php artisan serve --host=0.0.0.0 --port=8000`, y en `app-movil/.env` poner `EXPO_PUBLIC_API_URL=http://TU_IP:8000/api`.

---

## Qué instalar

**En el computador**
1. **Node.js LTS** (versión 20 o 22): https://nodejs.org → botón "LTS". Comprueba con `node -v`.
2. **Git**: https://git-scm.com/downloads. Comprueba con `git --version`.
3. **Visual Studio Code** (editor recomendado): https://code.visualstudio.com
4. Opcional, para emulador: **Android Studio** (https://developer.android.com/studio) con un dispositivo virtual.

**En el teléfono**
- **Expo Go** desde Play Store o App Store.

El teléfono y el computador deben estar **en la misma red Wi-Fi**.

## Poner la app a funcionar (con la API simulada)

```bash
# 1. Descargar el código
git clone https://github.com/EsleiderMeza/prueba-tecnica-galaxia-seguridad.git
cd prueba-tecnica-galaxia-seguridad

# 2. Arrancar la API simulada (dejar esta terminal abierta)
cd mock-api
npm start
#  -> "API simulada en http://localhost:8787/api"
```

En **otra terminal**:

```bash
cd prueba-tecnica-galaxia-seguridad/app-movil
npm install
```

3. Averigua la IP local del computador:
   - Windows: `ipconfig` → "Dirección IPv4" (ej. `192.168.1.50`)
   - macOS: `ipconfig getifaddr en0`
   - Linux: `hostname -I`

4. Crea el archivo `app-movil/.env` con esa IP:

```
EXPO_PUBLIC_API_URL=http://192.168.1.50:8787/api
```

5. Inicia la app:

```bash
npx expo start
```

6. Escanea el código QR con **Expo Go** (Android) o con la cámara (iPhone).
   En la parte de abajo del login se ve la URL del servidor que está usando la app.

**Usuarios de prueba** (contraseña `password` para todos):

| Correo | Rol |
|---|---|
| admin@galaxia.com | Administrador (asigna técnicos, ve todo) |
| tecnico@galaxia.com | Técnico |
| tecnico2@galaxia.com | Técnico |
| usuario@galaxia.com | Usuario (crea solicitudes) |

### Problemas comunes

- **"No se pudo conectar con el servidor"**: revisa que la IP del `.env` sea la del computador, que `mock-api` siga corriendo y que el firewall de Windows permita Node.js en redes privadas. Prueba abrir `http://TU_IP:8787/api/estados` en el navegador del teléfono: debe responder `{"message":"Unauthenticated."}`.
- **Cambié el `.env` y no hace efecto**: detén Expo y ejecuta `npx expo start -c`.
- **Wi-Fi de la empresa o red que bloquea dispositivos**: usa `npx expo start --tunnel` (la API seguirá necesitando ser alcanzable; en ese caso usa el emulador con `http://10.0.2.2:8787/api`).
- **Emulador Android**: usa `EXPO_PUBLIC_API_URL=http://10.0.2.2:8787/api` y pulsa `a` en la terminal de Expo.

> La API simulada guarda todo en memoria y se reinicia al detenerla. Sirve para desarrollar y
> mostrar el frontend; la entrega final debe conectarse al backend Laravel desplegado.
