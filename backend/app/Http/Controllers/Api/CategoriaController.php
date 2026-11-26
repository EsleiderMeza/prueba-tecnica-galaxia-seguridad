<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoriaResource;
use App\Models\Categoria;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CategoriaController extends Controller
{
    public function index(Request $request)
    {
        $request->validate(['tipo' => ['nullable', Rule::in(Categoria::TIPOS)]]);

        $categorias = Categoria::query()
            ->when($request->filled('tipo'), fn ($q) => $q->where('tipo', $request->tipo))
            ->when(! $request->boolean('incluir_inactivas'), fn ($q) => $q->where('activo', true))
            ->orderBy('tipo')->orderBy('nombre')
            ->get();

        return CategoriaResource::collection($categorias);
    }

    public function store(Request $request)
    {
        $categoria = Categoria::create($this->validar($request));

        return (new CategoriaResource($categoria))->response()->setStatusCode(201);
    }

    public function show(Categoria $categoria)
    {
        return new CategoriaResource($categoria);
    }

    public function update(Request $request, Categoria $categoria)
    {
        $categoria->update($this->validar($request, $categoria));

        return new CategoriaResource($categoria);
    }

    public function destroy(Categoria $categoria)
    {
        if ($categoria->equipos()->exists() || $categoria->solicitudes()->exists()) {
            return response()->json([
                'message' => 'No se puede eliminar: la categoría está en uso. Puedes desactivarla.',
            ], 409);
        }

        $categoria->delete();

        return response()->noContent();
    }

    private function validar(Request $request, ?Categoria $categoria = null): array
    {
        return $request->validate([
            'nombre' => [
                'required', 'string', 'max:80',
                Rule::unique('categorias')->where('tipo', $request->input('tipo'))->ignore($categoria?->id),
            ],
            'tipo' => ['required', Rule::in(Categoria::TIPOS)],
            'descripcion' => ['nullable', 'string', 'max:255'],
            'activo' => ['sometimes', 'boolean'],
        ], [
            'nombre.unique' => 'Ya existe una categoría con ese nombre para ese tipo.',
            'tipo.in' => 'El tipo debe ser equipo o solicitud.',
        ]);
    }
}
