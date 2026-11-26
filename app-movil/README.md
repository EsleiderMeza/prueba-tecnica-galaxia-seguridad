# Galaxia Soporte — App móvil

App en **React Native + Expo (SDK 58)** para el sistema de gestión de soporte técnico e inventario
tecnológico de la prueba técnica de Galaxia Seguridad. Consume la API REST Laravel descrita en
[`docs/API_CONTRACT.md`](docs/API_CONTRACT.md).

## Funcionalidades

| Requisito de la prueba | Dónde está |
|---|---|
| Inicio de sesión | `src/app/login.tsx` (token Sanctum guardado en SecureStore) |
| Panel principal | `src/app/(tabs)/index.tsx` (indicadores, solicitudes por estado, recientes, accesos rápidos) |
| Registro y consulta de equipos | `src/app/(tabs)/equipos.tsx`, `src/app/equipo/[id].tsx`, `src/app/equipo/form.tsx` (crear y editar) |
| Inventario tecnológico | `src/app/(tabs)/inventario.tsx` (totales por estado, categoría y ubicación) |
| Creación de solicitudes de soporte | `src/app/solicitud/nueva.tsx` (también desde el detalle de un equipo) |
| Consulta del estado de solicitudes | `src/app/(tabs)/solicitudes.tsx` (filtros por estado y búsqueda), `src/app/solicitud/[id].tsx` |
| Asignación de técnicos | Detalle de solicitud, sección "Asignar técnico" (solo administrador) |
| Registro de diagnósticos y soluciones | Detalle de solicitud, sección "Diagnóstico y solución" (técnico asignado o administrador) |
| Historial de atención | Línea de tiempo en cada solicitud, historial por equipo y pestaña `Historial` global |

Los permisos se muestran según el rol (`admin`, `tecnico`, `usuario`), pero quien los hace cumplir es la API.

## Estructura

```
src/
  app/                 Rutas (Expo Router): cada archivo es una pantalla
    _layout.tsx        Stack raíz + protección de rutas según sesión
    login.tsx
    (tabs)/            Pestañas: Panel, Equipos, Solicitudes, Inventario, Historial
    equipo/            Detalle y formulario de equipo
    solicitud/         Detalle (asignar, diagnosticar, cambiar estado) y nueva solicitud
  api/                 Cliente HTTP, tipos y endpoints
  context/auth.tsx     Sesión (login, logout, restauración, roles)
  components/          Componentes de UI reutilizables
  utils/               Hooks de carga/paginación y formato
docs/API_CONTRACT.md   Contrato con el backend
```

## Instalación y ejecución

Requisitos: Node.js 20+ y la app **Expo Go** en el teléfono (o un emulador Android). Guía paso a paso, incluida la API simulada, en el [README principal](../README.md).

```bash
npm install
cp .env.example .env         # y editar EXPO_PUBLIC_API_URL
npx expo start               # escanear el QR con Expo Go
```

### URL de la API

Se toma de `EXPO_PUBLIC_API_URL` (archivo `.env`) y, si no existe, de `expo.extra.apiUrl` en `app.json`.
La URL activa se ve en la parte inferior de la pantalla de login.

- Emulador Android con Laravel local (`php artisan serve`): `http://10.0.2.2:8000/api`
- Teléfono físico con Laravel local: `http://<IP-de-tu-PC>:8000/api` (`php artisan serve --host 0.0.0.0`)
- Backend desplegado: `https://<tu-backend>/api`

## APK instalable (mecanismo de prueba)

```bash
npx eas-cli@latest login
npx eas-cli@latest build -p android --profile preview   # genera un .apk descargable
```

El perfil `preview` de `eas.json` produce un APK y fija `EXPO_PUBLIC_API_URL`; actualízalo con la URL pública del backend antes de compilar.

## Verificación

```bash
npm run typecheck
npm run lint
```
