<?php

/*
| Solo se sobrescriben las opciones que cambian; el resto usa los valores de Sanctum.
*/
return [
    // Minutos de vida de un token de acceso. Pasado ese tiempo la API responde 401
    // y la app pide iniciar sesión de nuevo. Por defecto 7 días.
    'expiration' => env('SANCTUM_EXPIRATION', 60 * 24 * 7),

    // Minutos sin usar la app tras los cuales la sesión se cierra (cierre por inactividad).
    // 0 lo desactiva. Por defecto 15 minutos.
    'idle_minutes' => (int) env('SESSION_IDLE_MINUTES', 15),
];
