<?php

namespace Database\Seeders;

use App\Models\Categoria;
use App\Models\Estado;
use App\Models\Rol;
use Illuminate\Database\Seeder;

class CatalogoSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            ['slug' => 'admin', 'nombre' => 'Administrador', 'descripcion' => 'Acceso total. Asigna técnicos y administra usuarios y catálogos.'],
            ['slug' => 'tecnico', 'nombre' => 'Técnico', 'descripcion' => 'Registra equipos y atiende las solicitudes asignadas.'],
            ['slug' => 'usuario', 'nombre' => 'Usuario', 'descripcion' => 'Consulta equipos y crea solicitudes de soporte.'],
        ];
        foreach ($roles as $rol) {
            Rol::updateOrCreate(['slug' => $rol['slug']], $rol);
        }

        $categorias = [
            'equipo' => ['Computador de escritorio', 'Portátil', 'Impresora', 'Red / Switch', 'Servidor', 'Periférico'],
            'solicitud' => ['Hardware', 'Software', 'Red e internet', 'Impresión', 'Correo y cuentas', 'Mantenimiento preventivo'],
        ];
        foreach ($categorias as $tipo => $nombres) {
            foreach ($nombres as $nombre) {
                Categoria::updateOrCreate(['nombre' => $nombre, 'tipo' => $tipo]);
            }
        }

        $estados = [
            ['slug' => 'abierta', 'nombre' => 'Abierta', 'color' => '#2563EB', 'es_final' => false],
            ['slug' => 'asignada', 'nombre' => 'Asignada', 'color' => '#7C3AED', 'es_final' => false],
            ['slug' => 'en_proceso', 'nombre' => 'En proceso', 'color' => '#EA580C', 'es_final' => false],
            ['slug' => 'resuelta', 'nombre' => 'Resuelta', 'color' => '#16A34A', 'es_final' => false],
            ['slug' => 'cerrada', 'nombre' => 'Cerrada', 'color' => '#475569', 'es_final' => true],
            ['slug' => 'cancelada', 'nombre' => 'Cancelada', 'color' => '#DC2626', 'es_final' => true],
        ];
        foreach ($estados as $i => $estado) {
            Estado::updateOrCreate(['slug' => $estado['slug']], $estado + ['orden' => $i + 1]);
        }
    }
}
