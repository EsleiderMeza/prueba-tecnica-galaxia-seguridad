<?php

namespace Tests\Feature;

use App\Models\Equipo;
use App\Models\Solicitud;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** Pruebas de las medidas de seguridad de la API. */
class SeguridadTest extends TestCase
{
    use RefreshDatabase;

    protected $seed = true;

    private function como(string $email): User
    {
        $user = User::where('email', $email)->firstOrFail();
        Sanctum::actingAs($user);

        return $user;
    }

    public function test_contrasenas_se_guardan_cifradas_con_hash(): void
    {
        $user = User::where('email', 'admin@galaxia.com')->first();

        $this->assertNotSame('password', $user->password);
        $this->assertTrue(password_get_info($user->password)['algo'] !== null);
        $this->postJson('/api/login', ['email' => 'admin@galaxia.com', 'password' => 'password'])
            ->assertOk()
            ->assertJsonMissingPath('user.password');
    }

    public function test_login_bloquea_fuerza_bruta_despues_de_5_intentos(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/login', ['email' => 'admin@galaxia.com', 'password' => 'mala'.$i])->assertStatus(422);
        }

        $this->postJson('/api/login', ['email' => 'admin@galaxia.com', 'password' => 'password'])
            ->assertStatus(429)
            ->assertJsonPath('message', 'Demasiados intentos. Espera un minuto e intenta de nuevo.');

        // Otro correo no queda bloqueado.
        $this->postJson('/api/login', ['email' => 'tecnico@galaxia.com', 'password' => 'password'])->assertOk();
    }

    public function test_token_vence_y_logout_lo_invalida(): void
    {
        $token = $this->postJson('/api/login', ['email' => 'usuario@galaxia.com', 'password' => 'password'])->json('token');

        $this->withToken($token)->getJson('/api/me')->assertOk();
        $this->withToken($token)->postJson('/api/logout')->assertOk();
        $this->app['auth']->forgetGuards();
        $this->withToken($token)->getJson('/api/me')->assertStatus(401);

        // Un token más viejo que SANCTUM_EXPIRATION ya no sirve.
        $token = $this->postJson('/api/login', ['email' => 'usuario@galaxia.com', 'password' => 'password'])->json('token');
        $this->app['auth']->forgetGuards();
        $this->travel(config('sanctum.expiration') + 1)->minutes();
        $this->withToken($token)->getJson('/api/me')->assertStatus(401);
    }

    public function test_usuario_inactivo_no_puede_entrar(): void
    {
        User::where('email', 'usuario@galaxia.com')->update(['activo' => false]);

        $this->postJson('/api/login', ['email' => 'usuario@galaxia.com', 'password' => 'password'])
            ->assertStatus(422)
            ->assertJsonMissingPath('token');
    }

    public function test_inyeccion_sql_en_busquedas_se_trata_como_texto(): void
    {
        $this->como('admin@galaxia.com');
        $equipos = Equipo::count();

        foreach (["' OR '1'='1", "'; DROP TABLE equipos; --", '1 UNION SELECT password FROM users'] as $ataque) {
            $this->getJson('/api/equipos?search='.urlencode($ataque))->assertOk()->assertJsonPath('meta.total', 0);
            $this->getJson('/api/solicitudes?search='.urlencode($ataque))->assertOk()->assertJsonPath('meta.total', 0);
            $this->getJson('/api/usuarios?search='.urlencode($ataque))->assertOk()->assertJsonPath('meta.total', 0);
        }

        $this->postJson('/api/login', ['email' => "admin@galaxia.com' --", 'password' => 'x'])->assertStatus(422);

        $this->assertTrue(Schema::hasTable('equipos'));
        $this->assertSame($equipos, Equipo::count());
    }

    public function test_parametros_con_tipo_incorrecto_responden_422_y_no_500(): void
    {
        $this->como('admin@galaxia.com');

        $this->getJson('/api/equipos?search[]=x')->assertStatus(422);
        $this->getJson('/api/solicitudes?search[]=x')->assertStatus(422);
        $this->getJson('/api/usuarios?search[]=x')->assertStatus(422);
    }

    public function test_no_se_pueden_asignar_campos_protegidos_al_crear_solicitud(): void
    {
        $usuario = $this->como('usuario@galaxia.com');
        $tecnico = User::where('email', 'tecnico@galaxia.com')->first();
        $equipo = Equipo::where('estado', '!=', 'dado_de_baja')->first();
        $categoria = \App\Models\Categoria::where('tipo', 'solicitud')->first();

        $id = $this->postJson('/api/solicitudes', [
            'equipo_id' => $equipo->id,
            'categoria_id' => $categoria->id,
            'titulo' => 'Intento de saltar el flujo',
            'descripcion' => 'Envío campos que no me corresponden.',
            'prioridad' => 'alta',
            'tecnico_id' => $tecnico->id,
            'solicitante_id' => $tecnico->id,
            'diagnostico' => 'falso',
        ])->assertCreated()->json('data.id');

        $s = Solicitud::find($id);
        $this->assertNull($s->tecnico_id);
        $this->assertNull($s->diagnostico);
        $this->assertSame($usuario->id, $s->solicitante_id);
        $this->assertSame('abierta', $s->estado->slug);
    }

    public function test_usuario_no_ve_ni_atiende_solicitudes_ajenas(): void
    {
        $ajena = Solicitud::where('solicitante_id', '!=', User::where('email', 'usuario@galaxia.com')->value('id'))->first();
        $this->como('usuario@galaxia.com');

        $this->getJson("/api/solicitudes/{$ajena->id}")->assertForbidden();
        $this->postJson("/api/solicitudes/{$ajena->id}/comentarios", ['comentario' => 'hola'])->assertForbidden();
        $this->postJson("/api/solicitudes/{$ajena->id}/estado", ['estado_id' => 1])->assertForbidden();
        $this->getJson('/api/usuarios')->assertForbidden();
    }

    public function test_respuestas_incluyen_cabeceras_de_seguridad(): void
    {
        $this->getJson('/api')
            ->assertOk()
            ->assertHeader('X-Content-Type-Options', 'nosniff')
            ->assertHeader('X-Frame-Options', 'DENY')
            ->assertHeader('X-RateLimit-Limit', '120');
    }

    public function test_errores_internos_no_muestran_detalles_en_produccion(): void
    {
        config(['app.debug' => false]);
        \Illuminate\Support\Facades\Route::get('/api/_falla', fn () => throw new \RuntimeException('SQLSTATE secreto'));

        $this->getJson('/api/_falla')
            ->assertStatus(500)
            ->assertJsonPath('message', 'Error interno del servidor. Intenta de nuevo más tarde.')
            ->assertDontSee('SQLSTATE');
    }
}
