# Evidencias de funcionamiento

## 1. Capturas de la app

Capturas del 26/11/2026 de la app (versión web en tamaño de teléfono, 390×844) conectada al backend Laravel con los datos de prueba. Recorrido automatizado con Playwright: 30 de 30 pasos correctos. Las imágenes están en [`evidencias/app-movil/`](evidencias/app-movil/).

### Administrador (admin@galaxia.com)

| Captura | Qué demuestra |
|---|---|
| [a01-login.png](evidencias/app-movil/a01-login.png) | Pantalla de inicio de sesión |
| [a02-login-error.png](evidencias/app-movil/a02-login-error.png) | Credenciales incorrectas: la API responde 422 y la app muestra el error |
| [a03-panel-admin.png](evidencias/app-movil/a03-panel-admin.png) | Panel principal con indicadores y solicitudes por estado |
| [a04-equipos.png](evidencias/app-movil/a04-equipos.png) | Consulta de equipos con paginación |
| [a05-equipos-busqueda.png](evidencias/app-movil/a05-equipos-busqueda.png) | Búsqueda de equipos |
| [a06-equipos-filtro.png](evidencias/app-movil/a06-equipos-filtro.png) | Filtro por estado del equipo |
| [a07-equipo-detalle.png](evidencias/app-movil/a07-equipo-detalle.png) | Ficha del equipo con sus solicitudes |
| [a08-equipo-errores-api.png](evidencias/app-movil/a08-equipo-errores-api.png) | Validaciones del backend mostradas bajo cada campo (código duplicado, campos obligatorios) |
| [a09-equipo-creado.png](evidencias/app-movil/a09-equipo-creado.png) | Registro de un equipo guardado en la base de datos |
| [a10-solicitud-validacion.png](evidencias/app-movil/a10-solicitud-validacion.png) | Validación del formulario de solicitud |
| [a11-solicitud-creada.png](evidencias/app-movil/a11-solicitud-creada.png) | Solicitud creada en estado Abierta |
| [a12-solicitud-admin.png](evidencias/app-movil/a12-solicitud-admin.png) | Asignación de técnico, diagnóstico y cambio de estado |
| [a13-solicitudes.png](evidencias/app-movil/a13-solicitudes.png) | Consulta del estado de las solicitudes |
| [a15-inventario.png](evidencias/app-movil/a15-inventario.png) | Inventario tecnológico por estado, categoría y ubicación |
| [a16-historial.png](evidencias/app-movil/a16-historial.png) | Historial de atención |

### Técnico (tecnico@galaxia.com)

| Captura | Qué demuestra |
|---|---|
| [t01-panel-tecnico.png](evidencias/app-movil/t01-panel-tecnico.png) | Panel con "Asignadas a mí" |
| [t02-asignadas.png](evidencias/app-movil/t02-asignadas.png) | Filtro "Solo asignadas a mí" |
| [t03-solicitud-resuelta.png](evidencias/app-movil/t03-solicitud-resuelta.png) | Diagnóstico y solución registrados, estado Resuelta |
| [t04-solicitud-cerrada.png](evidencias/app-movil/t04-solicitud-cerrada.png) | Cierre de la solicitud con fecha de cierre e historial completo |

### Usuario (usuario@galaxia.com)

| Captura | Qué demuestra |
|---|---|
| [u01-panel-usuario.png](evidencias/app-movil/u01-panel-usuario.png) | Panel sin la acción "Registrar equipo" |
| [u02-equipo-usuario.png](evidencias/app-movil/u02-equipo-usuario.png) | Ficha de equipo sin botones de editar ni eliminar |

## 2. Pruebas automáticas del backend

`php artisan test` en `backend/` ejecuta 24 pruebas: 13 de funcionalidad en [`tests/Feature/ApiTest.php`](../backend/tests/Feature/ApiTest.php) y 11 de seguridad en [`tests/Feature/SeguridadTest.php`](../backend/tests/Feature/SeguridadTest.php).

Última ejecución (26/11/2026, PHP 8.3): **24 pruebas correctas, 199 verificaciones (assertions), 0 fallos**.

| Prueba | Qué verifica |
|---|---|
| `login_devuelve_token_y_usuario` | Login correcto entrega token y usuario con rol |
| `login_con_clave_incorrecta_responde_422` | Credenciales malas → 422 |
| `sin_token_responde_401` | Rutas protegidas sin token → 401 |
| `catalogos` | Categorías, estados, técnicos y roles |
| `equipos_listado_paginado_y_busqueda` | Paginación y búsqueda |
| `tecnico_crea_equipo_y_valida_codigo_unico` | Registro y código de inventario único |
| `usuario_no_puede_crear_equipos_y_tecnico_no_puede_eliminar` | Permisos por rol → 403 |
| `admin_elimina_equipo_sin_solicitudes_pero_no_con_solicitudes` | Integridad referencial → 409 |
| `flujo_completo_de_una_solicitud` | Crear, asignar, diagnosticar, resolver, cerrar, reabrir y su historial |
| `visibilidad_de_solicitudes_por_rol` | Cada rol ve solo lo que le corresponde |
| `validacion_de_solicitud` | Reglas de validación → 422 |
| `inventario` | Totales del inventario |
| `administracion_de_usuarios_solo_admin` | CRUD de usuarios restringido al administrador |

Pruebas de seguridad (`SeguridadTest.php`):

| Prueba | Qué verifica |
|---|---|
| `contrasenas_se_guardan_cifradas_con_hash` | La contraseña se guarda con hash y nunca sale en el JSON |
| `login_bloquea_fuerza_bruta_despues_de_5_intentos` | Al sexto intento en un minuto → 429 |
| `token_vence_y_logout_lo_invalida` | Tras cerrar sesión o pasados 7 días el token → 401 |
| `sesion_se_cierra_tras_15_minutos_sin_uso` | Usando la app la sesión sigue; 16 minutos sin uso → 401 "Tu sesión se cerró por inactividad" y el token se borra |
| `usuario_inactivo_no_puede_entrar` | Usuario desactivado no recibe token |
| `inyeccion_sql_en_busquedas_se_trata_como_texto` | `' OR '1'='1`, `DROP TABLE` y `UNION SELECT` se tratan como texto; la base queda intacta |
| `parametros_con_tipo_incorrecto_responden_422_y_no_500` | Parámetros mal formados se rechazan sin error interno |
| `no_se_pueden_asignar_campos_protegidos_al_crear_solicitud` | Enviar `tecnico_id` o `solicitante_id` no tiene efecto (*mass assignment*) |
| `usuario_no_ve_ni_atiende_solicitudes_ajenas` | Permisos por registro → 403 |
| `respuestas_incluyen_cabeceras_de_seguridad` | Cabeceras `nosniff`, `DENY` y límite de peticiones |
| `errores_internos_no_muestran_detalles_en_produccion` | Un error 500 no revela SQL ni rutas |

## 3. Despliegue en funcionamiento

| Qué | Cómo comprobarlo |
|---|---|
| API publicada | Abrir https://galaxia-soporte-api.onrender.com/api → `{"nombre":"API Soporte Técnico · Galaxia Seguridad","version":"1.0","estado":"ok"}` |
| Salud del servidor | https://galaxia-soporte-api.onrender.com/up → 200 |
| Datos persistentes | Crear un equipo o una solicitud desde el APK, cerrar la app, volver a entrar (o entrar desde otro teléfono): el registro sigue ahí porque está en PostgreSQL (Neon) |
| APK | Enlace de descarga en [DESPLIEGUE.md](DESPLIEGUE.md#estado-actual-del-despliegue) |

## 4. Guion para la demostración en vivo

1. Instalar el APK en el teléfono y abrir la app (la primera respuesta puede tardar hasta un minuto si Render estaba dormido; conviene abrir https://galaxia-soporte-api.onrender.com/up unos minutos antes).
2. Entrar como **usuario@galaxia.com** y crear una solicitud sobre un equipo. Cerrar sesión.
3. Entrar como **admin@galaxia.com**, abrir la solicitud nueva y asignarla a Tomás Técnico.
4. Entrar como **tecnico@galaxia.com**, activar "Solo asignadas a mí", abrir la solicitud, registrar diagnóstico y solución y pasarla a Resuelta.
5. Volver como administrador y cerrarla. Mostrar el historial de atención completo y el Panel actualizado.
6. Registrar un equipo nuevo y mostrar que aparece en Inventario.
7. Intentar registrar otro equipo con el mismo código para mostrar la validación.
