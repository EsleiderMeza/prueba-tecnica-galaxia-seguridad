<?php

namespace App\Http\Requests;

use App\Models\Equipo;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class EquipoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // los permisos por rol se validan en las rutas
    }

    public function rules(): array
    {
        $id = $this->route('equipo')?->id;

        return [
            'codigo_inventario' => ['required', 'string', 'max:50', Rule::unique('equipos', 'codigo_inventario')->ignore($id)],
            'nombre' => ['required', 'string', 'max:120'],
            'categoria_id' => ['required', 'integer', Rule::exists('categorias', 'id')->where('tipo', 'equipo')],
            'marca' => ['nullable', 'string', 'max:80'],
            'modelo' => ['nullable', 'string', 'max:80'],
            'serial' => ['nullable', 'string', 'max:100'],
            'ubicacion' => ['nullable', 'string', 'max:120'],
            'responsable' => ['nullable', 'string', 'max:120'],
            'estado' => ['required', Rule::in(Equipo::ESTADOS)],
            'fecha_adquisicion' => ['nullable', 'date', 'before_or_equal:today'],
            'observaciones' => ['nullable', 'string', 'max:2000'],
        ];
    }

    public function messages(): array
    {
        return [
            'codigo_inventario.unique' => 'Ya existe un equipo con este código de inventario.',
            'categoria_id.exists' => 'La categoría seleccionada no es una categoría de equipos.',
            'estado.in' => 'El estado debe ser operativo, en_mantenimiento o dado_de_baja.',
        ];
    }

    protected function prepareForValidation(): void
    {
        // Textos vacíos se guardan como null
        $this->merge(collect($this->all())->map(fn ($v) => is_string($v) ? (trim($v) === '' ? null : trim($v)) : $v)->all());
    }
}
