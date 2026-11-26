<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Rol extends Model
{
    public const ADMIN = 'admin';

    public const TECNICO = 'tecnico';

    public const USUARIO = 'usuario';

    protected $table = 'roles';

    protected $fillable = ['nombre', 'slug', 'descripcion'];

    public function usuarios(): HasMany
    {
        return $this->hasMany(User::class);
    }
}
