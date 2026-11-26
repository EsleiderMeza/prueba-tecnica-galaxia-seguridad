<?php

namespace App\Http\Requests;

use App\Models\Solicitud;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SolicitudRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'equipo_id' => ['required', 'integer', Rule::exists('equipos', 'id')->whereNot('estado', 'dado_de_baja')],
            'categoria_id' => ['required', 'integer', Rule::exists('categorias', 'id')->where('tipo', 'solicitud')],
            'titulo' => ['required', 'string', 'min:5', 'max:150'],
            'descripcion' => ['required', 'string', 'min:10', 'max:5000'],
            'prioridad' => ['required', Rule::in(Solicitud::PRIORIDADES)],
        ];
    }

    public function messages(): array
    {
        return [
            'equipo_id.exists' => 'El equipo no existe o está dado de baja.',
            'categoria_id.exists' => 'La categoría seleccionada no es una categoría de solicitudes.',
            'prioridad.in' => 'La prioridad debe ser baja, media, alta o critica.',
        ];
    }
}
