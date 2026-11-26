<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EquipoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'codigo_inventario' => $this->codigo_inventario,
            'nombre' => $this->nombre,
            'categoria' => $this->categoria ? new CategoriaResource($this->categoria) : null,
            'marca' => $this->marca,
            'modelo' => $this->modelo,
            'serial' => $this->serial,
            'ubicacion' => $this->ubicacion,
            'responsable' => $this->responsable,
            'estado' => $this->estado,
            'fecha_adquisicion' => $this->fecha_adquisicion?->format('Y-m-d'),
            'observaciones' => $this->observaciones,
            'solicitudes_count' => $this->whenCounted('solicitudes'),
            'solicitudes' => SolicitudResource::collection($this->whenLoaded('solicitudes')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
