<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            CatalogoSeeder::class,   // roles, categorías y estados
            UsuarioSeeder::class,    // usuarios de prueba
            DemoSeeder::class,       // equipos y solicitudes de ejemplo
        ]);
    }
}
