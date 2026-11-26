<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Solicitud extends Model
{
    public const PRIORIDADES = ['baja', 'media', 'alta', 'critica'];

    protected $table = 'solicitudes';

    protected $fillable = [
        'titulo', 'descripcion', 'prioridad', 'equipo_id', 'categoria_id', 'estado_id',
        'solicitante_id', 'tecnico_id', 'diagnostico', 'solucion', 'fecha_asignacion', 'fecha_cierre',
    ];

    protected function casts(): array
    {
        return [
            'fecha_asignacion' => 'datetime',
            'fecha_cierre' => 'datetime',
        ];
    }

    public function equipo(): BelongsTo
    {
        return $this->belongsTo(Equipo::class);
    }

    public function categoria(): BelongsTo
    {
        return $this->belongsTo(Categoria::class);
    }

    public function estado(): BelongsTo
    {
        return $this->belongsTo(Estado::class);
    }

    public function solicitante(): BelongsTo
    {
        return $this->belongsTo(User::class, 'solicitante_id');
    }

    public function tecnico(): BelongsTo
    {
        return $this->belongsTo(User::class, 'tecnico_id');
    }

    public function asignaciones(): HasMany
    {
        return $this->hasMany(Asignacion::class);
    }

    public function historial(): HasMany
    {
        return $this->hasMany(Historial::class);
    }

    /**
     * Solicitudes que el usuario puede ver:
     * admin todas; técnico las asignadas a él y las que creó; usuario solo las que creó.
     */
    public function scopeVisiblesPara(Builder $query, User $user): Builder
    {
        if ($user->esAdmin()) {
            return $query;
        }

        if ($user->esTecnico()) {
            return $query->where(fn ($q) => $q->where('tecnico_id', $user->id)->orWhere('solicitante_id', $user->id));
        }

        return $query->where('solicitante_id', $user->id);
    }

    /** Registra una acción en el historial de atención. */
    public function registrar(string $accion, string $descripcion, ?User $user, ?Estado $anterior = null, ?Estado $nuevo = null): Historial
    {
        return $this->historial()->create([
            'accion' => $accion,
            'descripcion' => $descripcion,
            'user_id' => $user?->id,
            'estado_anterior_id' => $anterior?->id,
            'estado_nuevo_id' => $nuevo?->id,
        ]);
    }
}
