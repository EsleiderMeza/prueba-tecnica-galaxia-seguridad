<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UsuarioRequest;
use App\Http\Resources\UsuarioResource;
use App\Models\Asignacion;
use App\Models\User;
use Illuminate\Http\Request;

/** Administración de usuarios (solo admin). */
class UsuarioController extends Controller
{
    public function index(Request $request)
    {
        $usuarios = User::with('rol')
            ->when($request->filled('search'), function ($q) use ($request) {
                $s = $this->like($request->search);
                $q->where(fn ($w) => $w->whereRaw('LOWER(nombre) LIKE ?', [$s])->orWhereRaw('LOWER(email) LIKE ?', [$s]));
            })
            ->when($request->filled('rol'), fn ($q) => $q->whereHas('rol', fn ($r) => $r->where('slug', $request->rol)))
            ->orderBy('nombre')
            ->paginate($this->perPage($request));

        return UsuarioResource::collection($usuarios);
    }

    public function store(UsuarioRequest $request)
    {
        $datos = $request->validated();
        $datos['email'] = strtolower($datos['email']);
        $usuario = User::create($datos);

        return (new UsuarioResource($usuario->load('rol')))->response()->setStatusCode(201);
    }

    public function show(User $usuario)
    {
        return new UsuarioResource($usuario->load('rol'));
    }

    public function update(UsuarioRequest $request, User $usuario)
    {
        $datos = $request->validated();

        if (empty($datos['password'])) {
            unset($datos['password']);
        }
        if (isset($datos['email'])) {
            $datos['email'] = strtolower($datos['email']);
        }

        if ($usuario->id === $request->user()->id && (($datos['activo'] ?? true) === false || (isset($datos['rol_id']) && $datos['rol_id'] !== $usuario->rol_id))) {
            return response()->json(['message' => 'No puedes desactivarte ni cambiar tu propio rol.'], 422);
        }

        $usuario->update($datos);

        if (array_key_exists('activo', $datos) && ! $datos['activo']) {
            $usuario->tokens()->delete(); // cierra sus sesiones
        }

        return new UsuarioResource($usuario->load('rol'));
    }

    public function destroy(Request $request, User $usuario)
    {
        if ($usuario->id === $request->user()->id) {
            return response()->json(['message' => 'No puedes eliminar tu propio usuario.'], 422);
        }

        $tieneRegistros = $usuario->solicitudesCreadas()->exists()
            || $usuario->solicitudesAsignadas()->exists()
            || Asignacion::where('tecnico_id', $usuario->id)->orWhere('asignado_por_id', $usuario->id)->exists();

        if ($tieneRegistros) {
            return response()->json([
                'message' => 'No se puede eliminar: el usuario tiene solicitudes. Puedes desactivarlo.',
            ], 409);
        }

        $usuario->tokens()->delete();
        $usuario->delete();

        return response()->noContent();
    }
}
