<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Usado al desplegar: carga los datos de prueba solo si la base de datos está vacía.
Artisan::command('app:seed-if-empty', function () {
    if (\App\Models\User::query()->exists()) {
        $this->info('La base de datos ya tiene datos; no se ejecutan los seeders.');

        return;
    }

    $this->call('db:seed', ['--force' => true]);
})->purpose('Ejecuta los seeders solo si no hay usuarios');
