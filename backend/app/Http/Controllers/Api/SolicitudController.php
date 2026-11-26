<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\SolicitudRequest;
use App\Http\Resources\SolicitudResource;
use App\Models\Asignacion;
use App\Models\Estado;
use App\Models\Solicitud;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class SolicitudController extends Controller
{
    private const RELACIONES = ['equipo', 'categoria', 'estado', 'solicitante', 'tecnico'];

    public function index(Request $request)
    {
        $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'estado_id' => ['nullable', 'integer'],
            'equipo_id' => ['nullable', 'integer'],
            'prioridad' => ['nullable', Rule::in(Solicitud::PRIORIDADES)],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $user = $request->user();

        $solicitudes = Solicitud::visiblesPara($user)
            ->with(self::RELACIONES)
            ->when($request->filled('search'), function ($q) use ($request) {
                $texto = trim($request->search);
                $s = $this->like($texto);
                $q->where(function ($w) use ($texto, $s) {
                    $w->whereRaw('LOWER(titulo) LIKE ?', [$s])
                        ->orWhereHas('equipo', fn ($e) => $e->whereRaw('LOWER(codigo_inventario) LIKE ?', [$s]));
                    if (ctype_digit(ltrim($texto, '#'))) {
                        $w->orWhere('id', (int) ltrim($texto, '#'));
                    }
                });
            })
            ->when($request->filled('estado_id'), fn ($q) => $q->where('estado_id', $request->estado_id))
            ->when($request->filled('prioridad'), fn ($q) => $q->where('prioridad', $request->prioridad))
            ->when($request->filled('equipo_id'), fn ($q) => $q->where('equipo_id', $request->equipo_id))
            ->when($request->boolean('asignadas_a_mi'), fn ($q) => $q->where('tecnico_id', $user->id))
            ->latest('id')
            ->paginate($this->perPage($request));

        return SolicitudResource::collection($solicitudes);
    }

    public function store(SolicitudRequest $request)
    {
        $solicitud = DB::transaction(function () use ($request) {
            $abierta = Estado::porSlug(Estado::ABIERTA);

            $solicitud = Solicitud::create($request->validated() + [
                'estado_id' => $abierta->id,
                'solicitante_id' => $request->user()->id,
            ]);

            $solicitud->registrar('creada', 'Solicitud creada', $request->user(), null, $abierta);

            return $solicitud;
        });

        return (new SolicitudResource($this->cargar($solicitud)))->response()->setStatusCode(201);
    }

    public function show(Request $request, Solicitud $solicitud)
    {
        $this->autorizarVer($request->user(), $solicitud);

        return new SolicitudResource($this->cargar($solicitud));
    }

    /** Solo el administrador asigna (o reasigna) técnicos. */
    public function asignar(Request $request, Solicitud $solicitud)
    {
        $datos = $request->validate([
            'tecnico_id' => [
                'required', 'integer',
                Rule::exists('users', 'id')->where('activo', true)
                    ->whereIn('rol_id', DB::table('roles')->where('slug', 'tecnico')->pluck('id')->all()),
            ],
        ], ['tecnico_id.exists' => 'El usuario seleccionado no es un técnico activo.']);

        $solicitud->load('estado');
        $this->noFinalizada($solicitud);

        if ((int) $solicitud->tecnico_id === (int) $datos['tecnico_id']) {
            throw ValidationException::withMessages(['tecnico_id' => 'La solicitud ya está asignada a este técnico.']);
        }

        DB::transaction(function () use ($request, $solicitud, $datos) {
            $tecnico = User::findOrFail($datos['tecnico_id']);
            $anterior = $solicitud->estado;
            $nuevo = $anterior;

            if ($anterior->slug === Estado::ABIERTA) {
                $nuevo = Estado::porSlug(Estado::ASIGNADA);
            }

            $reasignacion = $solicitud->tecnico_id !== null;

            $solicitud->asignaciones()->where('activa', true)->update(['activa' => false]);
            Asignacion::create([
                'solicitud_id' => $solicitud->id,
                'tecnico_id' => $tecnico->id,
                'asignado_por_id' => $request->user()->id,
            ]);

            $solicitud->update([
                'tecnico_id' => $tecnico->id,
                'fecha_asignacion' => now(),
                'estado_id' => $nuevo->id,
            ]);

            $solicitud->registrar(
                'asignada',
                ($reasignacion ? 'Reasignada a ' : 'Asignada a ').$tecnico->nombre,
                $request->user(),
                $nuevo->id !== $anterior->id ? $anterior : null,
                $nuevo->id !== $anterior->id ? $nuevo : null,
            );
        });

        return new SolicitudResource($this->cargar($solicitud));
    }

    /** Registra diagnóstico y solución (admin o técnico asignado). */
    public function diagnostico(Request $request, Solicitud $solicitud)
    {
        $this->autorizarAtender($request->user(), $solicitud);

        $datos = $request->validate([
            'diagnostico' => ['required', 'string', 'min:5', 'max:5000'],
            'solucion' => ['nullable', 'string', 'max:5000'],
            'estado_id' => ['nullable', 'integer', 'exists:estados,id'],
        ]);

        $solicitud->load('estado');
        $this->noFinalizada($solicitud);

        DB::transaction(function () use ($request, $solicitud, $datos) {
            $anterior = $solicitud->estado;
            $nuevo = ! empty($datos['estado_id']) ? Estado::findOrFail($datos['estado_id']) : $anterior;
            $cambia = $nuevo->id !== $anterior->id;

            $solicitud->update([
                'diagnostico' => $datos['diagnostico'],
                'solucion' => $datos['solucion'] ?? null,
                'estado_id' => $nuevo->id,
                'fecha_cierre' => $nuevo->es_final ? now() : null,
            ]);

            $texto = 'Diagnóstico: '.$datos['diagnostico'];
            if (! empty($datos['solucion'])) {
                $texto .= '. Solución: '.$datos['solucion'];
            }

            $solicitud->registrar('diagnostico', $texto, $request->user(), $cambia ? $anterior : null, $cambia ? $nuevo : null);
        });

        return new SolicitudResource($this->cargar($solicitud));
    }

    /** Cambia el estado (admin o técnico asignado). */
    public function cambiarEstado(Request $request, Solicitud $solicitud)
    {
        $user = $request->user();
        $this->autorizarAtender($user, $solicitud);

        $datos = $request->validate([
            'estado_id' => ['required', 'integer', 'exists:estados,id'],
            'comentario' => ['nullable', 'string', 'max:2000'],
        ]);

        $solicitud->load('estado');
        $anterior = $solicitud->estado;
        $nuevo = Estado::findOrFail($datos['estado_id']);

        if ($nuevo->id === $anterior->id) {
            throw ValidationException::withMessages(['estado_id' => 'La solicitud ya está en ese estado.']);
        }

        DB::transaction(function () use ($user, $solicitud, $datos, $anterior, $nuevo) {
            $solicitud->update([
                'estado_id' => $nuevo->id,
                'fecha_cierre' => $nuevo->es_final ? now() : null,
            ]);

            $descripcion = ! empty($datos['comentario']) ? $datos['comentario'] : 'Cambio de estado';

            $solicitud->registrar('estado', $descripcion, $user, $anterior, $nuevo);
        });

        return new SolicitudResource($this->cargar($solicitud));
    }

    /** Agrega un comentario al historial (quien puede ver la solicitud). */
    public function comentar(Request $request, Solicitud $solicitud)
    {
        $this->autorizarVer($request->user(), $solicitud);

        $datos = $request->validate(['comentario' => ['required', 'string', 'min:2', 'max:2000']]);

        $solicitud->registrar('comentario', $datos['comentario'], $request->user());
        $solicitud->touch();

        return new SolicitudResource($this->cargar($solicitud));
    }

    private function cargar(Solicitud $solicitud): Solicitud
    {
        return $solicitud->refresh()->load([
            ...self::RELACIONES,
            'historial' => fn ($q) => $q->with(['usuario', 'estadoAnterior', 'estadoNuevo'])->orderBy('created_at')->orderBy('id'),
        ]);
    }

    private function autorizarVer(User $user, Solicitud $solicitud): void
    {
        $puede = $user->esAdmin()
            || $solicitud->solicitante_id === $user->id
            || ($user->esTecnico() && $solicitud->tecnico_id === $user->id);

        abort_unless($puede, 403, 'No tienes permiso para ver esta solicitud.');
    }

    private function autorizarAtender(User $user, Solicitud $solicitud): void
    {
        $puede = $user->esAdmin() || ($user->esTecnico() && $solicitud->tecnico_id === $user->id);

        abort_unless($puede, 403, 'Solo el administrador o el técnico asignado pueden atender esta solicitud.');
    }

    private function noFinalizada(Solicitud $solicitud): void
    {
        if ($solicitud->estado->es_final) {
            throw ValidationException::withMessages([
                'estado_id' => "La solicitud está {$solicitud->estado->nombre}. Cámbiale el estado para reabrirla.",
            ]);
        }
    }
}
