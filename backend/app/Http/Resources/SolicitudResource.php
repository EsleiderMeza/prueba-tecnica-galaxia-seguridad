<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SolicitudResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $persona = fn ($u) => $u ? ['id' => $u->id, 'nombre' => $u->nombre, 'email' => $u->email] : null;

        return [
            'id' => $this->id,
            'titulo' => $this->titulo,
            'descripcion' => $this->descripcion,
            'prioridad' => $this->prioridad,
            'equipo' => $this->equipo ? [
                'id' => $this->equipo->id,
                'codigo_inventario' => $this->equipo->codigo_inventario,
                'nombre' => $this->equipo->nombre,
            ] : null,
            'categoria' => $this->categoria ? new CategoriaResource($this->categoria) : null,
            'estado' => $this->estado ? new EstadoResource($this->estado) : null,
            'solicitante' => $persona($this->solicitante),
            'tecnico' => $persona($this->tecnico),
            'diagnostico' => $this->diagnostico,
            'solucion' => $this->solucion,
            'fecha_asignacion' => $this->fecha_asignacion,
            'fecha_cierre' => $this->fecha_cierre,
            'historial' => HistorialResource::collection($this->whenLoaded('historial')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
