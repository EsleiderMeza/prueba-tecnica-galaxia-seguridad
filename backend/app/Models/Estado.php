<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Estado extends Model
{
    public const ABIERTA = 'abierta';

    public const ASIGNADA = 'asignada';

    protected $table = 'estados';

    protected $fillable = ['nombre', 'slug', 'color', 'es_final', 'orden'];

    protected function casts(): array
    {
        return ['es_final' => 'boolean', 'orden' => 'integer'];
    }

    public static function porSlug(string $slug): self
    {
        return static::where('slug', $slug)->firstOrFail();
    }

    public function solicitudes(): HasMany
    {
        return $this->hasMany(Solicitud::class);
    }
}
