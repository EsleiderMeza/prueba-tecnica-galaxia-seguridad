<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class HistorialResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'solicitud_id' => $this->solicitud_id,
            'accion' => $this->accion,
            'descripcion' => $this->descripcion,
            'estado_anterior' => $this->estadoAnterior ? new EstadoResource($this->estadoAnterior) : null,
            'estado_nuevo' => $this->estadoNuevo ? new EstadoResource($this->estadoNuevo) : null,
            'usuario' => $this->usuario ? ['id' => $this->usuario->id, 'nombre' => $this->usuario->nombre] : null,
            'solicitud' => $this->whenLoaded('solicitud', fn () => [
                'id' => $this->solicitud->id,
                'titulo' => $this->solicitud->titulo,
                'equipo' => $this->solicitud->equipo ? [
                    'id' => $this->solicitud->equipo->id,
                    'codigo_inventario' => $this->solicitud->equipo->codigo_inventario,
                    'nombre' => $this->solicitud->equipo->nombre,
                ] : null,
            ]),
            'created_at' => $this->created_at,
        ];
    }
}
