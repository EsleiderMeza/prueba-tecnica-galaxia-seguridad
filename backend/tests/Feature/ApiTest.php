<?php

namespace Tests\Feature;

use App\Models\Categoria;
use App\Models\Equipo;
use App\Models\Estado;
use App\Models\Rol;
use App\Models\Solicitud;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ApiTest extends TestCase
{
    use RefreshDatabase;

    protected $seed = true;

    private function como(string $email): User
    {
        $user = User::where('email', $email)->firstOrFail();
        Sanctum::actingAs($user);

        return $user;
    }

    public function test_login_devuelve_token_y_usuario(): void
    {
        $this->postJson('/api/login', ['email' => 'admin@galaxia.com', 'password' => 'password', 'device_name' => 'test'])
            ->assertOk()
            ->assertJsonStructure(['token', 'user' => ['id', 'nombre', 'email', 'rol' => ['id', 'nombre', 'slug']]])
            ->assertJsonPath('user.rol.slug', 'admin');
    }

    public function test_login_con_clave_incorrecta_responde_422(): void
    {
        $this->postJson('/api/login', ['email' => 'admin@galaxia.com', 'password' => 'otra'])
            ->assertStatus(422)
            ->assertJsonStructure(['message', 'errors' => ['email']]);
    }

    public function test_sin_token_responde_401(): void
    {
        $this->getJson('/api/me')->assertStatus(401)->assertExactJson(['message' => 'Unauthenticated.']);
    }

    public function test_catalogos(): void
    {
        $this->como('usuario@galaxia.com');

        $this->getJson('/api/categorias?tipo=equipo')->assertOk()->assertJsonPath('data.0.tipo', 'equipo');
        $this->getJson('/api/estados')->assertOk()->assertJsonCount(6, 'data')->assertJsonPath('data.0.slug', 'abierta');
        $this->getJson('/api/tecnicos')->assertOk()->assertJsonCount(2, 'data');
    }

    public function test_equipos_listado_paginado_y_busqueda(): void
    {
        $this->como('usuario@galaxia.com');

        $this->getJson('/api/equipos')->assertOk()
            ->assertJsonCount(10, 'data')
            ->assertJsonPath('meta.total', 23)
            ->assertJsonPath('meta.per_page', 10);

        $this->getJson('/api/equipos?search=switch')->assertOk()->assertJsonPath('meta.total', 2);
        $this->getJson('/api/equipos?estado=dado_de_baja')->assertOk()->assertJsonPath('meta.total', 1);
    }

    public function test_tecnico_crea_equipo_y_valida_codigo_unico(): void
    {
        $this->como('tecnico@galaxia.com');
        $categoria = Categoria::where('tipo', 'equipo')->first();

        $datos = ['codigo_inventario' => 'GS-900', 'nombre' => 'PC Nueva', 'categoria_id' => $categoria->id, 'estado' => 'operativo', 'fecha_adquisicion' => '2025-01-10'];

        $this->postJson('/api/equipos', $datos)->assertCreated()
            ->assertJsonPath('data.codigo_inventario', 'GS-900')
            ->assertJsonPath('data.fecha_adquisicion', '2025-01-10')
            ->assertJsonPath('data.categoria.id', $categoria->id);

        $this->postJson('/api/equipos', $datos)->assertStatus(422)->assertJsonValidationErrors('codigo_inventario');
        $this->postJson('/api/equipos', [])->assertStatus(422)->assertJsonValidationErrors(['codigo_inventario', 'nombre', 'categoria_id', 'estado']);
    }

    public function test_usuario_no_puede_crear_equipos_y_tecnico_no_puede_eliminar(): void
    {
        $this->como('usuario@galaxia.com');
        $this->postJson('/api/equipos', [])->assertStatus(403)->assertJsonStructure(['message']);

        $this->como('tecnico@galaxia.com');
        $this->deleteJson('/api/equipos/22')->assertStatus(403);
    }

    public function test_admin_elimina_equipo_sin_solicitudes_pero_no_con_solicitudes(): void
    {
        $this->como('admin@galaxia.com');
        $this->deleteJson('/api/equipos/22')->assertNoContent();
        $this->deleteJson('/api/equipos/11')->assertStatus(409);
        $this->getJson('/api/equipos/9999')->assertNotFound()->assertJsonPath('message', 'El equipo no existe.');
    }

    public function test_flujo_completo_de_una_solicitud(): void
    {
        // 1. El usuario crea la solicitud
        $usuario = $this->como('usuario@galaxia.com');
        $categoria = Categoria::where('tipo', 'solicitud')->first();

        $id = $this->postJson('/api/solicitudes', [
            'equipo_id' => 2, 'categoria_id' => $categoria->id, 'titulo' => 'No abre Excel',
            'descripcion' => 'Al abrir Excel aparece un error de licencia.', 'prioridad' => 'media',
        ])->assertCreated()
            ->assertJsonPath('data.estado.slug', 'abierta')
            ->assertJsonPath('data.solicitante.id', $usuario->id)
            ->assertJsonPath('data.historial.0.accion', 'creada')
            ->json('data.id');

        // El técnico aún no la puede ver ni diagnosticar
        $tecnico = $this->como('tecnico@galaxia.com');
        $this->getJson("/api/solicitudes/$id")->assertStatus(403);
        $this->postJson("/api/solicitudes/$id/diagnostico", ['diagnostico' => 'Algo'])->assertStatus(403);
        $this->postJson("/api/solicitudes/$id/asignar", ['tecnico_id' => $tecnico->id])->assertStatus(403);

        // 2. El admin asigna el técnico
        $this->como('admin@galaxia.com');
        $this->postJson("/api/solicitudes/$id/asignar", ['tecnico_id' => $usuario->id])->assertStatus(422)->assertJsonValidationErrors('tecnico_id');
        $this->postJson("/api/solicitudes/$id/asignar", ['tecnico_id' => $tecnico->id])->assertOk()
            ->assertJsonPath('data.estado.slug', 'asignada')
            ->assertJsonPath('data.tecnico.id', $tecnico->id)
            ->assertJsonPath('data.historial.1.accion', 'asignada');
        $this->assertDatabaseHas('asignaciones', ['solicitud_id' => $id, 'tecnico_id' => $tecnico->id, 'activa' => true]);

        // 3. El técnico asignado diagnostica y cambia el estado
        $this->como('tecnico@galaxia.com');
        $enProceso = Estado::where('slug', 'en_proceso')->first();
        $this->postJson("/api/solicitudes/$id/diagnostico", ['diagnostico' => 'Licencia de Office vencida', 'solucion' => 'Se reactivó la licencia', 'estado_id' => $enProceso->id])
            ->assertOk()
            ->assertJsonPath('data.diagnostico', 'Licencia de Office vencida')
            ->assertJsonPath('data.estado.slug', 'en_proceso');

        $this->getJson('/api/solicitudes?asignadas_a_mi=1')->assertOk()->assertJsonFragment(['id' => $id]);

        $cerrada = Estado::where('slug', 'cerrada')->first();
        $this->postJson("/api/solicitudes/$id/estado", ['estado_id' => $cerrada->id, 'comentario' => 'Usuario conforme'])
            ->assertOk()
            ->assertJsonPath('data.estado.slug', 'cerrada');
        $this->assertNotNull(Solicitud::find($id)->fecha_cierre);

        // Finalizada: ya no admite diagnóstico, pero sí reabrirla cambiando el estado
        $this->postJson("/api/solicitudes/$id/diagnostico", ['diagnostico' => 'Otro diagnóstico'])->assertStatus(422);
        $this->postJson("/api/solicitudes/$id/estado", ['estado_id' => $cerrada->id])->assertStatus(422);

        // 4. Historial completo en orden cronológico
        $this->como('usuario@galaxia.com');
        $acciones = collect($this->getJson("/api/solicitudes/$id")->assertOk()->json('data.historial'))->pluck('accion')->all();
        $this->assertSame(['creada', 'asignada', 'diagnostico', 'estado'], $acciones);

        $this->getJson("/api/historial?solicitud_id=$id")->assertOk()
            ->assertJsonPath('meta.total', 4)
            ->assertJsonPath('data.0.accion', 'estado')
            ->assertJsonPath('data.0.solicitud.id', $id)
            ->assertJsonStructure(['data' => [['solicitud' => ['equipo' => ['codigo_inventario']]]]]);
    }

    public function test_visibilidad_de_solicitudes_por_rol(): void
    {
        $this->como('admin@galaxia.com');
        $this->getJson('/api/solicitudes')->assertJsonPath('meta.total', 5);

        $this->como('usuario@galaxia.com');
        $this->getJson('/api/solicitudes')->assertJsonPath('meta.total', 4);

        // tecnico@: 2 asignadas + 1 creada por él
        $this->como('tecnico@galaxia.com');
        $this->getJson('/api/solicitudes')->assertJsonPath('meta.total', 3);
        $this->getJson('/api/dashboard')->assertOk()->assertJsonPath('data.mis_asignadas', 2)
            ->assertJsonStructure(['data' => ['equipos_total', 'solicitudes_total', 'solicitudes_abiertas', 'mis_asignadas', 'por_estado', 'recientes']]);
    }

    public function test_validacion_de_solicitud(): void
    {
        $this->como('usuario@galaxia.com');

        $this->postJson('/api/solicitudes', ['titulo' => 'abc', 'descripcion' => 'corta', 'prioridad' => 'urgente', 'equipo_id' => 23])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['titulo', 'descripcion', 'prioridad', 'categoria_id', 'equipo_id']);
    }

    public function test_inventario(): void
    {
        $this->como('usuario@galaxia.com');

        $this->getJson('/api/inventario')->assertOk()
            ->assertJsonPath('data.total', Equipo::count())
            ->assertJsonStructure(['data' => ['por_categoria' => [['id', 'nombre', 'total']], 'por_estado' => [['estado', 'total']], 'por_ubicacion' => [['ubicacion', 'total']]]]);
    }

    public function test_administracion_de_usuarios_solo_admin(): void
    {
        $this->como('tecnico@galaxia.com');
        $this->getJson('/api/usuarios')->assertStatus(403);

        $this->como('admin@galaxia.com');
        $rolTecnico = Rol::where('slug', 'tecnico')->value('id');
        $id = $this->postJson('/api/usuarios', ['nombre' => 'Nuevo Técnico', 'email' => 'nuevo@galaxia.com', 'password' => 'secreta123', 'rol_id' => $rolTecnico])
            ->assertCreated()->assertJsonPath('data.rol.slug', 'tecnico')->json('data.id');

        $this->postJson('/api/usuarios', ['nombre' => 'X', 'email' => 'nuevo@galaxia.com', 'password' => 'secreta123', 'rol_id' => $rolTecnico])
            ->assertStatus(422)->assertJsonValidationErrors('email');

        $this->putJson("/api/usuarios/$id", ['activo' => false])->assertOk()->assertJsonPath('data.activo', false);
        $this->postJson('/api/login', ['email' => 'nuevo@galaxia.com', 'password' => 'secreta123'])->assertStatus(422);
    }
}
