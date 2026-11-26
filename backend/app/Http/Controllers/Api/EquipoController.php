<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\EquipoRequest;
use App\Http\Resources\EquipoResource;
use App\Models\Equipo;
use App\Models\Solicitud;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class EquipoController extends Controller
{
    public function index(Request $request)
    {
        $request->validate([
            'estado' => ['nullable', Rule::in(Equipo::ESTADOS)],
            'categoria_id' => ['nullable', 'integer'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $equipos = Equipo::with('categoria')
            ->when($request->filled('search'), function ($q) use ($request) {
                $s = $this->like($request->search);
                $q->where(function ($w) use ($s) {
                    foreach (['codigo_inventario', 'nombre', 'serial', 'marca', 'modelo', 'ubicacion'] as $campo) {
                        $w->orWhereRaw("LOWER($campo) LIKE ?", [$s]);
                    }
                });
            })
            ->when($request->filled('estado'), fn ($q) => $q->where('estado', $request->estado))
            ->when($request->filled('categoria_id'), fn ($q) => $q->where('categoria_id', $request->categoria_id))
            ->latest('id')
            ->paginate($this->perPage($request));

        return EquipoResource::collection($equipos);
    }

    public function store(EquipoRequest $request)
    {
        $equipo = Equipo::create($request->validated());

        return (new EquipoResource($equipo->load('categoria')))->response()->setStatusCode(201);
    }

    public function show(Request $request, Equipo $equipo)
    {
        $equipo->load(['categoria', 'solicitudes' => fn ($q) => $q
            ->visiblesPara($request->user())
            ->with(['equipo', 'categoria', 'estado', 'solicitante', 'tecnico'])
            ->latest('id'),
        ]);

        return new EquipoResource($equipo);
    }

    public function update(EquipoRequest $request, Equipo $equipo)
    {
        $equipo->update($request->validated());

        return new EquipoResource($equipo->load('categoria'));
    }

    public function destroy(Equipo $equipo)
    {
        if (Solicitud::where('equipo_id', $equipo->id)->exists()) {
            return response()->json([
                'message' => 'No se puede eliminar: el equipo tiene solicitudes de soporte. Puedes marcarlo como dado de baja.',
            ], 409);
        }

        $equipo->delete();

        return response()->noContent();
    }
}
