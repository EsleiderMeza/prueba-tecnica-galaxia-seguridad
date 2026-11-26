<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

abstract class Controller
{
    /** Tamaño de página: por defecto 10, máximo 100. */
    protected function perPage(Request $request): int
    {
        return max(1, min(100, (int) $request->input('per_page', 10)));
    }

    /** Patrón para búsquedas sin distinguir mayúsculas (igual en SQLite, MySQL y PostgreSQL). */
    protected function like(string $texto): string
    {
        return '%'.mb_strtolower(trim($texto)).'%';
    }
}
