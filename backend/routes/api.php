<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CatalogoController;
use App\Http\Controllers\Api\CategoriaController;
use App\Http\Controllers\Api\EquipoController;
use App\Http\Controllers\Api\EstadoController;
use App\Http\Controllers\Api\PanelController;
use App\Http\Controllers\Api\SolicitudController;
use App\Http\Controllers\Api\UsuarioController;
use Illuminate\Support\Facades\Route;

/*
| API REST de Galaxia Seguridad. Todas las rutas tienen el prefijo /api.
| Documentación completa: docs/API.md (en la raíz del repositorio)
*/

Route::get('/', fn () => response()->json([
    'nombre' => 'API Soporte Técnico · Galaxia Seguridad',
    'version' => '1.0',
    'estado' => 'ok',
]));

Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    Route::get('/dashboard', [PanelController::class, 'dashboard']);
    Route::get('/inventario', [PanelController::class, 'inventario']);
    Route::get('/historial', [PanelController::class, 'historial']);

    // Catálogos (lectura para todos)
    Route::get('/categorias', [CategoriaController::class, 'index']);
    Route::get('/categorias/{categoria}', [CategoriaController::class, 'show']);
    Route::get('/estados', [CatalogoController::class, 'estados']);
    Route::get('/estados/{estado}', [EstadoController::class, 'show']);
    Route::get('/tecnicos', [CatalogoController::class, 'tecnicos']);
    Route::get('/roles', [CatalogoController::class, 'roles']);

    // Equipos
    Route::get('/equipos', [EquipoController::class, 'index']);
    Route::get('/equipos/{equipo}', [EquipoController::class, 'show']);
    Route::middleware('rol:admin,tecnico')->group(function () {
        Route::post('/equipos', [EquipoController::class, 'store']);
        Route::put('/equipos/{equipo}', [EquipoController::class, 'update']);
    });

    // Solicitudes
    Route::get('/solicitudes', [SolicitudController::class, 'index']);
    Route::post('/solicitudes', [SolicitudController::class, 'store']);
    Route::get('/solicitudes/{solicitud}', [SolicitudController::class, 'show']);
    Route::post('/solicitudes/{solicitud}/asignar', [SolicitudController::class, 'asignar'])->middleware('rol:admin');
    Route::post('/solicitudes/{solicitud}/diagnostico', [SolicitudController::class, 'diagnostico'])->middleware('rol:admin,tecnico');
    Route::post('/solicitudes/{solicitud}/estado', [SolicitudController::class, 'cambiarEstado'])->middleware('rol:admin,tecnico');
    Route::post('/solicitudes/{solicitud}/comentarios', [SolicitudController::class, 'comentar']);

    // Solo administrador
    Route::middleware('rol:admin')->group(function () {
        Route::delete('/equipos/{equipo}', [EquipoController::class, 'destroy']);

        Route::post('/categorias', [CategoriaController::class, 'store']);
        Route::put('/categorias/{categoria}', [CategoriaController::class, 'update']);
        Route::delete('/categorias/{categoria}', [CategoriaController::class, 'destroy']);

        Route::post('/estados', [EstadoController::class, 'store']);
        Route::put('/estados/{estado}', [EstadoController::class, 'update']);
        Route::delete('/estados/{estado}', [EstadoController::class, 'destroy']);

        Route::apiResource('usuarios', UsuarioController::class)->parameters(['usuarios' => 'usuario']);
    });
});
