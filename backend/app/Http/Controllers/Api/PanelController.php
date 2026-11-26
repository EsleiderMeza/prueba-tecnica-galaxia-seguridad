<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\HistorialResource;
use App\Http\Resources\SolicitudResource;
use App\Models\Equipo;
use App\Models\Estado;
use App\Models\Historial;
use App\Models\Solicitud;
use Illuminate\Http\Request;

/** Panel principal, inventario e historial general. */
class PanelController extends Controller
{
    public function dashboard(Request $request)
    {
        $user = $request->user();
        $visibles = fn () => Solicitud::visiblesPara($user);

        $porEstado = $visibles()->selectRaw('estado_id, COUNT(*) as total')->groupBy('estado_id')->pluck('total', 'estado_id');

        $misAsignadas = $user->esTecnico()
            ? $visibles()->where('tecnico_id', $user->id)
            : $visibles()->whereNotNull('tecnico_id');

        return response()->json(['data' => [
            'equipos_total' => Equipo::count(),
            'solicitudes_total' => $visibles()->count(),
            'solicitudes_abiertas' => $visibles()->whereHas('estado', fn ($q) => $q->where('es_final', false))->count(),
            'mis_asignadas' => $misAsignadas->count(),
            'por_estado' => Estado::orderBy('orden')->orderBy('id')->get()->map(fn ($e) => [
                'id' => $e->id,
                'nombre' => $e->nombre,
                'slug' => $e->slug,
                'color' => $e->color,
                'total' => (int) ($porEstado[$e->id] ?? 0),
            ]),
            'recientes' => SolicitudResource::collection(
                $visibles()->with(['equipo', 'categoria', 'estado', 'solicitante', 'tecnico'])->latest('id')->limit(5)->get()
            ),
        ]]);
    }

    public function inventario()
    {
        $porCategoria = Equipo::query()
            ->join('categorias', 'categorias.id', '=', 'equipos.categoria_id')
            ->selectRaw('categorias.id, categorias.nombre, COUNT(*) as total')
            ->groupBy('categorias.id', 'categorias.nombre')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($r) => ['id' => $r->id, 'nombre' => $r->nombre, 'total' => (int) $r->total]);

        $porEstado = Equipo::selectRaw('estado, COUNT(*) as total')->groupBy('estado')->orderByDesc('total')->get()
            ->map(fn ($r) => ['estado' => $r->estado, 'total' => (int) $r->total]);

        $porUbicacion = Equipo::selectRaw("COALESCE(ubicacion, 'Sin ubicación') as ubicacion, COUNT(*) as total")
            ->groupByRaw("COALESCE(ubicacion, 'Sin ubicación')")->orderByDesc('total')->get()
            ->map(fn ($r) => ['ubicacion' => $r->ubicacion, 'total' => (int) $r->total]);

        return response()->json(['data' => [
            'total' => Equipo::count(),
            'por_categoria' => $porCategoria,
            'por_estado' => $porEstado,
            'por_ubicacion' => $porUbicacion,
        ]]);
    }

    public function historial(Request $request)
    {
        $request->validate([
            'solicitud_id' => ['nullable', 'integer'],
            'equipo_id' => ['nullable', 'integer'],
        ]);

        $visibles = Solicitud::visiblesPara($request->user())->select('id');

        $historial = Historial::with(['usuario', 'estadoAnterior', 'estadoNuevo', 'solicitud.equipo'])
            ->whereIn('solicitud_id', $visibles)
            ->when($request->filled('solicitud_id'), fn ($q) => $q->where('solicitud_id', $request->solicitud_id))
            ->when($request->filled('equipo_id'), fn ($q) => $q->whereHas('solicitud', fn ($s) => $s->where('equipo_id', $request->equipo_id)))
            ->orderByDesc('created_at')->orderByDesc('id')
            ->paginate($this->perPage($request));

        return HistorialResource::collection($historial);
    }
}
