<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $fillable = ['nombre', 'email', 'password', 'rol_id', 'activo'];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'activo' => 'boolean',
        ];
    }

    public function rol(): BelongsTo
    {
        return $this->belongsTo(Rol::class);
    }

    public function solicitudesCreadas(): HasMany
    {
        return $this->hasMany(Solicitud::class, 'solicitante_id');
    }

    public function solicitudesAsignadas(): HasMany
    {
        return $this->hasMany(Solicitud::class, 'tecnico_id');
    }

    public function tieneRol(string ...$slugs): bool
    {
        return in_array($this->rol?->slug, $slugs, true);
    }

    public function esAdmin(): bool
    {
        return $this->tieneRol(Rol::ADMIN);
    }

    public function esTecnico(): bool
    {
        return $this->tieneRol(Rol::TECNICO);
    }

    public function scopeTecnicos(Builder $query): Builder
    {
        return $query->whereHas('rol', fn ($q) => $q->where('slug', Rol::TECNICO));
    }
}
