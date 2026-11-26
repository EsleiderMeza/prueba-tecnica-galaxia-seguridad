<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Solicitudes de soporte, sus asignaciones a técnicos y el historial de atención.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('solicitudes', function (Blueprint $table) {
            $table->id();
            $table->string('titulo', 150);
            $table->text('descripcion');
            $table->string('prioridad', 20)->default('media')->index(); // baja | media | alta | critica
            $table->foreignId('equipo_id')->constrained('equipos')->restrictOnDelete();
            $table->foreignId('categoria_id')->constrained('categorias')->restrictOnDelete();
            $table->foreignId('estado_id')->constrained('estados')->restrictOnDelete();
            $table->foreignId('solicitante_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('tecnico_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('diagnostico')->nullable();
            $table->text('solucion')->nullable();
            $table->timestamp('fecha_asignacion')->nullable();
            $table->timestamp('fecha_cierre')->nullable();
            $table->timestamps();
        });

        // Cada vez que el administrador asigna (o reasigna) un técnico queda un registro.
        Schema::create('asignaciones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('solicitud_id')->constrained('solicitudes')->cascadeOnDelete();
            $table->foreignId('tecnico_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('asignado_por_id')->constrained('users')->restrictOnDelete();
            $table->boolean('activa')->default(true);
            $table->timestamps();
        });

        Schema::create('historial', function (Blueprint $table) {
            $table->id();
            $table->foreignId('solicitud_id')->constrained('solicitudes')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('accion', 30)->index(); // creada | asignada | estado | diagnostico | comentario
            $table->text('descripcion');
            $table->foreignId('estado_anterior_id')->nullable()->constrained('estados')->nullOnDelete();
            $table->foreignId('estado_nuevo_id')->nullable()->constrained('estados')->nullOnDelete();
            $table->timestamp('created_at')->nullable()->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('historial');
        Schema::dropIfExists('asignaciones');
        Schema::dropIfExists('solicitudes');
    }
};
