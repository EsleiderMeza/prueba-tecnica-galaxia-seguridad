<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Catálogos: categorías (una sola tabla para equipos y solicitudes, separadas por "tipo")
 * y estados de las solicitudes.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('categorias', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 80);
            $table->string('tipo', 20)->index(); // equipo | solicitud
            $table->string('descripcion')->nullable();
            $table->boolean('activo')->default(true);
            $table->timestamps();
            $table->unique(['nombre', 'tipo']);
        });

        Schema::create('estados', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 50);
            $table->string('slug', 30)->unique();
            $table->string('color', 7)->default('#64748B');
            $table->boolean('es_final')->default(false);
            $table->unsignedSmallInteger('orden')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('estados');
        Schema::dropIfExists('categorias');
    }
};
