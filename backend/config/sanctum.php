<?php

/*
| Solo se sobrescriben las opciones que cambian; el resto usa los valores de Sanctum.
*/
return [
    // Minutos de vida de un token de acceso. Pasado ese tiempo la API responde 401
    // y la app pide iniciar sesión de nuevo. Por defecto 7 días.
    'expiration' => env('SANCTUM_EXPIRATION', 60 * 24 * 7),
];
