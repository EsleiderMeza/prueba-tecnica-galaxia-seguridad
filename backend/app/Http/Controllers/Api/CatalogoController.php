<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\EstadoResource;
use App\Http\Resources\RolResource;
use App\Http\Resources\UsuarioResource;
use App\Models\Estado;
use App\Models\Rol;
use App\Models\User;

/** Listas de solo lectura que usa la app para llenar selectores. */
class CatalogoController extends Controller
{
    public function estados()
    {
        return EstadoResource::collection(Estado::orderBy('orden')->orderBy('id')->get());
    }

    public function roles()
    {
        return RolResource::collection(Rol::orderBy('id')->get());
    }

    public function tecnicos()
    {
        return UsuarioResource::collection(
            User::tecnicos()->where('activo', true)->with('rol')->orderBy('nombre')->get()
        );
    }
}
