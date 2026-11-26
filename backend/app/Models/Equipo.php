<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Equipo extends Model
{
    public const ESTADOS = ['operativo', 'en_mantenimiento', 'dado_de_baja'];

    protected $table = 'equipos';

    protected $fillable = [
        'codigo_inventario', 'nombre', 'categoria_id', 'marca', 'modelo', 'serial',
        'ubicacion', 'responsable', 'estado', 'fecha_adquisicion', 'observaciones',
    ];

    protected function casts(): array
    {
        return ['fecha_adquisicion' => 'date:Y-m-d'];
    }

    public function categoria(): BelongsTo
    {
        return $this->belongsTo(Categoria::class);
    }

    public function solicitudes(): HasMany
    {
        return $this->hasMany(Solicitud::class);
    }
}
