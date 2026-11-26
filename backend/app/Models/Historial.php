<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Historial extends Model
{
    public const UPDATED_AT = null;

    protected $table = 'historial';

    protected $fillable = ['solicitud_id', 'user_id', 'accion', 'descripcion', 'estado_anterior_id', 'estado_nuevo_id'];

    public function solicitud(): BelongsTo
    {
        return $this->belongsTo(Solicitud::class);
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function estadoAnterior(): BelongsTo
    {
        return $this->belongsTo(Estado::class, 'estado_anterior_id');
    }

    public function estadoNuevo(): BelongsTo
    {
        return $this->belongsTo(Estado::class, 'estado_nuevo_id');
    }
}
