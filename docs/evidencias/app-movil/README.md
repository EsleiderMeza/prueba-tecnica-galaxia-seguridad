# Evidencias de la app móvil

Capturas tomadas el 26/11/2026 con la app (versión web, tamaño de teléfono 390×844) conectada al
backend Laravel de este repositorio (mismo código que el desplegado, base SQLite con los datos de prueba).
Recorrido automatizado con Playwright: 30 de 30 pasos correctos.

| Prefijo | Rol | Qué muestra |
|---|---|---|
| `a01`–`a16` | Administrador | Login (validación y clave errónea), panel, equipos (búsqueda, filtro, detalle, edición, registro con errores de la API), nueva solicitud, asignación de técnico, diagnóstico, solicitudes, inventario e historial |
| `t01`–`t04` | Técnico | Panel, filtro "solo asignadas a mí", diagnóstico y solución, cambio de estado a Resuelta y Cerrada |
| `u01`–`u05` | Usuario | Panel sin opciones de gestión, equipo sin editar/eliminar, creación de solicitud sin acciones técnicas, solo sus solicitudes, historial |
