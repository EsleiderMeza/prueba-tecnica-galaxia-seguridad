<?php

namespace Database\Seeders;

use App\Models\Asignacion;
use App\Models\Categoria;
use App\Models\Equipo;
use App\Models\Estado;
use App\Models\Solicitud;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

/** Equipos y solicitudes de ejemplo para la demostración. */
class DemoSeeder extends Seeder
{
    public function run(): void
    {
        if (Equipo::exists()) {
            return; // no duplicar datos si ya se sembró
        }

        $cat = Categoria::where('tipo', 'equipo')->pluck('id', 'nombre');
        $catSol = Categoria::where('tipo', 'solicitud')->pluck('id', 'nombre');
        $estado = Estado::all()->keyBy('slug');

        $equipos = [
            ['PC Recepción', 'Computador de escritorio', 'Dell', 'OptiPlex 3080', 'Sede principal', 'Marta Gómez'],
            ['PC Contabilidad 1', 'Computador de escritorio', 'HP', 'ProDesk 400 G7', 'Sede principal', 'Carlos Ruiz'],
            ['PC Contabilidad 2', 'Computador de escritorio', 'HP', 'ProDesk 400 G7', 'Sede principal', 'Diana López'],
            ['PC Monitoreo CCTV', 'Computador de escritorio', 'Lenovo', 'ThinkCentre M70s', 'Centro de monitoreo', 'Turno monitoreo'],
            ['PC Monitoreo 2', 'Computador de escritorio', 'Lenovo', 'ThinkCentre M70s', 'Centro de monitoreo', 'Turno monitoreo'],
            ['Portátil Gerencia', 'Portátil', 'Lenovo', 'ThinkPad T14', 'Sede principal', 'Gerencia'],
            ['Portátil Comercial 1', 'Portátil', 'Dell', 'Latitude 5420', 'Sede norte', 'Andrés Mora'],
            ['Portátil Comercial 2', 'Portátil', 'Dell', 'Latitude 5420', 'Sede norte', 'Paula Ríos'],
            ['Portátil Soporte', 'Portátil', 'HP', 'ProBook 450 G8', 'Sede principal', 'Área de sistemas'],
            ['Portátil Supervisor', 'Portátil', 'Asus', 'ExpertBook B1', 'Sede sur', 'Supervisor de zona'],
            ['Impresora HP piso 2', 'Impresora', 'HP', 'LaserJet Pro M404', 'Sede principal', 'Administración'],
            ['Multifuncional Recepción', 'Impresora', 'Epson', 'EcoTank L6270', 'Sede principal', 'Marta Gómez'],
            ['Impresora Sede norte', 'Impresora', 'Brother', 'HL-L5100DN', 'Sede norte', 'Andrés Mora'],
            ['Switch principal', 'Red / Switch', 'Cisco', 'CBS250-24T', 'Cuarto de comunicaciones', 'Área de sistemas'],
            ['Switch Sede norte', 'Red / Switch', 'TP-Link', 'TL-SG3428', 'Sede norte', 'Área de sistemas'],
            ['Router borde', 'Red / Switch', 'MikroTik', 'RB4011', 'Cuarto de comunicaciones', 'Área de sistemas'],
            ['Access Point piso 1', 'Red / Switch', 'Ubiquiti', 'UniFi U6 Lite', 'Sede principal', 'Área de sistemas'],
            ['Servidor de archivos', 'Servidor', 'Dell', 'PowerEdge T150', 'Cuarto de comunicaciones', 'Área de sistemas'],
            ['NVR Cámaras', 'Servidor', 'Hikvision', 'DS-7616NI', 'Centro de monitoreo', 'Turno monitoreo'],
            ['UPS Rack', 'Periférico', 'APC', 'Smart-UPS 1500', 'Cuarto de comunicaciones', 'Área de sistemas'],
            ['Monitor Monitoreo 1', 'Periférico', 'Samsung', 'S24R350', 'Centro de monitoreo', 'Turno monitoreo'],
            ['Lector biométrico', 'Periférico', 'ZKTeco', 'K40', 'Sede principal', 'Recursos humanos'],
            ['PC Antiguo Bodega', 'Computador de escritorio', 'Compaq', 'dc5800', 'Bodega', null],
        ];

        $creados = [];
        foreach ($equipos as $i => [$nombre, $categoria, $marca, $modelo, $ubicacion, $responsable]) {
            $n = $i + 1;
            $creados[$n] = Equipo::create([
                'codigo_inventario' => sprintf('GS-%03d', $n),
                'nombre' => $nombre,
                'categoria_id' => $cat[$categoria],
                'marca' => $marca,
                'modelo' => $modelo,
                'serial' => strtoupper(substr($marca, 0, 3)).'-'.(48210 + $n * 37),
                'ubicacion' => $ubicacion,
                'responsable' => $responsable,
                'estado' => match (true) {
                    $n === 23 => 'dado_de_baja',
                    in_array($n, [4, 13], true) => 'en_mantenimiento',
                    default => 'operativo',
                },
                'fecha_adquisicion' => Carbon::create(2021, 1, 15)->addDays($n * 41)->toDateString(),
                'observaciones' => $n === 23 ? 'Equipo obsoleto, pendiente de disposición final.' : null,
            ]);
        }

        $admin = User::where('email', 'admin@galaxia.com')->first();
        $tecnico = User::where('email', 'tecnico@galaxia.com')->first();
        $tecnico2 = User::where('email', 'tecnico2@galaxia.com')->first();
        $usuario = User::where('email', 'usuario@galaxia.com')->first();

        $inicio = now()->subDays(6)->setTime(8, 0);

        // 1. Resuelta y cerrada
        $s = $this->solicitud($creados[6], $catSol['Hardware'], $usuario, 'El portátil no carga la batería', 'El indicador de carga no enciende con el cargador conectado.', 'media', $inicio->copy());
        $this->asignar($s, $tecnico2, $admin, $estado, $inicio->copy()->addHours(2));
        $this->cambiar($s, $estado['resuelta'], $tecnico2, 'Diagnóstico: cargador defectuoso. Solución: se reemplazó el cargador por uno original de 65W.', 'diagnostico', $inicio->copy()->addDay(), 'Cargador defectuoso (no entrega voltaje).', 'Se reemplazó el cargador por uno original de 65W.');
        $this->cambiar($s, $estado['cerrada'], $admin, 'Usuario confirma que el equipo funciona.', 'estado', $inicio->copy()->addDays(2));

        // 2. Creada por el técnico, asignada a la otra técnica
        $s = $this->solicitud($creados[19], $catSol['Mantenimiento preventivo'], $tecnico, 'Mantenimiento preventivo NVR', 'Limpieza interna y revisión de discos del grabador de cámaras.', 'baja', $inicio->copy()->addDays(2));
        $this->asignar($s, $tecnico2, $admin, $estado, $inicio->copy()->addDays(2)->addHours(3));

        // 3. Asignada al técnico
        $s = $this->solicitud($creados[1], $catSol['Software'], $usuario, 'Windows muy lento al iniciar', 'El equipo tarda más de 10 minutos en arrancar y se congela al abrir el correo.', 'media', $inicio->copy()->addDays(3));
        $this->asignar($s, $tecnico, $admin, $estado, $inicio->copy()->addDays(3)->addHour());

        // 4. En proceso con diagnóstico
        $s = $this->solicitud($creados[14], $catSol['Red e internet'], $usuario, 'Sin internet en recepción', 'No hay conexión en los puntos de red de recepción; el wifi sí funciona.', 'critica', $inicio->copy()->addDays(4));
        $this->asignar($s, $tecnico, $admin, $estado, $inicio->copy()->addDays(4)->addMinutes(20));
        $this->cambiar($s, $estado['en_proceso'], $tecnico, 'Diagnóstico: puerto 12 del switch principal sin enlace, cable dañado.', 'diagnostico', $inicio->copy()->addDays(4)->addHours(2), 'Puerto 12 del switch principal sin enlace, cable de parcheo dañado.');

        // 5. Abierta, sin asignar
        $this->solicitud($creados[11], $catSol['Impresión'], $usuario, 'La impresora no imprime', 'Sale la hoja en blanco desde ayer en la tarde, ya se cambió el papel.', 'alta', $inicio->copy()->addDays(5));
    }

    private function solicitud(Equipo $equipo, int $categoriaId, User $solicitante, string $titulo, string $descripcion, string $prioridad, Carbon $fecha): Solicitud
    {
        $abierta = Estado::where('slug', 'abierta')->first();
        $s = new Solicitud([
            'titulo' => $titulo, 'descripcion' => $descripcion, 'prioridad' => $prioridad,
            'equipo_id' => $equipo->id, 'categoria_id' => $categoriaId,
            'estado_id' => $abierta->id, 'solicitante_id' => $solicitante->id,
        ]);
        $s->created_at = $fecha;
        $s->updated_at = $fecha;
        $s->save();
        $this->historial($s, 'creada', 'Solicitud creada', $solicitante, null, $abierta, $fecha);

        return $s;
    }

    private function asignar(Solicitud $s, User $tecnico, User $admin, $estado, Carbon $fecha): void
    {
        Asignacion::create(['solicitud_id' => $s->id, 'tecnico_id' => $tecnico->id, 'asignado_por_id' => $admin->id]);
        $s->forceFill(['tecnico_id' => $tecnico->id, 'fecha_asignacion' => $fecha, 'estado_id' => $estado['asignada']->id, 'updated_at' => $fecha])->saveQuietly();
        $this->historial($s, 'asignada', 'Asignada a '.$tecnico->nombre, $admin, $estado['abierta'], $estado['asignada'], $fecha);
    }

    private function cambiar(Solicitud $s, Estado $nuevo, User $user, string $texto, string $accion, Carbon $fecha, ?string $diagnostico = null, ?string $solucion = null): void
    {
        $anterior = Estado::find($s->estado_id);
        $s->forceFill(array_filter([
            'estado_id' => $nuevo->id,
            'diagnostico' => $diagnostico,
            'solucion' => $solucion,
            'fecha_cierre' => $nuevo->es_final ? $fecha : null,
            'updated_at' => $fecha,
        ], fn ($v) => $v !== null))->saveQuietly();
        $this->historial($s, $accion, $texto, $user, $anterior, $nuevo, $fecha);
    }

    private function historial(Solicitud $s, string $accion, string $texto, User $user, ?Estado $ant, ?Estado $nue, Carbon $fecha): void
    {
        $h = $s->historial()->make([
            'accion' => $accion, 'descripcion' => $texto, 'user_id' => $user->id,
            'estado_anterior_id' => $ant?->id, 'estado_nuevo_id' => $nue?->id,
        ]);
        $h->created_at = $fecha;
        $h->save();
    }
}
