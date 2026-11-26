<?php

namespace Database\Seeders;

use App\Models\Rol;
use App\Models\User;
use Illuminate\Database\Seeder;

/** Usuarios de prueba. Contraseña de todos: password */
class UsuarioSeeder extends Seeder
{
    public function run(): void
    {
        $rol = Rol::pluck('id', 'slug');

        $usuarios = [
            ['nombre' => 'Ana Admin', 'email' => 'admin@galaxia.com', 'rol' => 'admin'],
            ['nombre' => 'Tomás Técnico', 'email' => 'tecnico@galaxia.com', 'rol' => 'tecnico'],
            ['nombre' => 'Laura Técnica', 'email' => 'tecnico2@galaxia.com', 'rol' => 'tecnico'],
            ['nombre' => 'Uriel Usuario', 'email' => 'usuario@galaxia.com', 'rol' => 'usuario'],
        ];

        foreach ($usuarios as $u) {
            User::updateOrCreate(['email' => $u['email']], [
                'nombre' => $u['nombre'],
                'password' => 'password',
                'rol_id' => $rol[$u['rol']],
                'activo' => true,
            ]);
        }
    }
}
