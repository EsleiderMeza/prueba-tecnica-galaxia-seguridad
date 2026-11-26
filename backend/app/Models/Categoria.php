<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Categoria extends Model
{
    public const TIPOS = ['equipo', 'solicitud'];

    protected $table = 'categorias';

    protected $fillable = ['nombre', 'tipo', 'descripcion', 'activo'];

    protected function casts(): array
    {
        return ['activo' => 'boolean'];
    }

    public function equipos(): HasMany
    {
        return $this->hasMany(Equipo::class);
    }

    public function solicitudes(): HasMany
    {
        return $this->hasMany(Solicitud::class);
    }
}
