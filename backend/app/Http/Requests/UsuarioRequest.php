<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UsuarioRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $usuario = $this->route('usuario');
        $creando = $usuario === null;

        return [
            'nombre' => [$creando ? 'required' : 'sometimes', 'string', 'max:120'],
            'email' => [$creando ? 'required' : 'sometimes', 'email', 'max:150', Rule::unique('users', 'email')->ignore($usuario?->id)],
            'password' => [$creando ? 'required' : 'nullable', 'string', Password::min(8)],
            'rol_id' => [$creando ? 'required' : 'sometimes', 'integer', 'exists:roles,id'],
            'activo' => ['sometimes', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return ['email.unique' => 'Ya existe un usuario con este correo.'];
    }
}
