<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\EstadoResource;
use App\Models\Estado;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/** Administración de estados (solo admin). El listado público está en CatalogoController. */
class EstadoController extends Controller
{
    /** Estados que usa el flujo interno y no se pueden borrar. */
    private const PROTEGIDOS = [Estado::ABIERTA, Estado::ASIGNADA];

    public function store(Request $request)
    {
        $estado = Estado::create($this->validar($request));

        return (new EstadoResource($estado))->response()->setStatusCode(201);
    }

    public function show(Estado $estado)
    {
        return new EstadoResource($estado);
    }

    public function update(Request $request, Estado $estado)
    {
        $datos = $this->validar($request, $estado);

        if (in_array($estado->slug, self::PROTEGIDOS, true)) {
            unset($datos['slug']); // el slug de los estados del flujo no cambia
        }

        $estado->update($datos);

        return new EstadoResource($estado);
    }

    public function destroy(Estado $estado)
    {
        if (in_array($estado->slug, self::PROTEGIDOS, true) || $estado->solicitudes()->exists()) {
            return response()->json(['message' => 'No se puede eliminar: el estado está en uso.'], 409);
        }

        $estado->delete();

        return response()->noContent();
    }

    private function validar(Request $request, ?Estado $estado = null): array
    {
        if (! $request->filled('slug') && $request->filled('nombre')) {
            $request->merge(['slug' => Str::slug($request->input('nombre'), '_')]);
        }

        return $request->validate([
            'nombre' => ['required', 'string', 'max:50'],
            'slug' => ['required', 'alpha_dash', 'max:30', Rule::unique('estados')->ignore($estado?->id)],
            'color' => ['nullable', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'es_final' => ['sometimes', 'boolean'],
            'orden' => ['sometimes', 'integer', 'min:0'],
        ], ['color.regex' => 'El color debe tener el formato #RRGGBB.']);
    }
}
