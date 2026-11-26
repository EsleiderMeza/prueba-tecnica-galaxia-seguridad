<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('equipos', function (Blueprint $table) {
            $table->id();
            $table->string('codigo_inventario', 50)->unique();
            $table->string('nombre', 120);
            $table->foreignId('categoria_id')->constrained('categorias')->restrictOnDelete();
            $table->string('marca', 80)->nullable();
            $table->string('modelo', 80)->nullable();
            $table->string('serial', 100)->nullable();
            $table->string('ubicacion', 120)->nullable()->index();
            $table->string('responsable', 120)->nullable();
            $table->string('estado', 30)->default('operativo')->index(); // operativo | en_mantenimiento | dado_de_baja
            $table->date('fecha_adquisicion')->nullable();
            $table->text('observaciones')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('equipos');
    }
};
