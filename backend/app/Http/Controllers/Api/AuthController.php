<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UsuarioResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $datos = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
            'device_name' => ['nullable', 'string', 'max:100'],
        ]);

        $user = User::with('rol')->where('email', strtolower($datos['email']))->first();

        if (! $user || ! Hash::check($datos['password'], $user->password)) {
            throw ValidationException::withMessages(['email' => 'Las credenciales no son válidas.']);
        }

        if (! $user->activo) {
            throw ValidationException::withMessages(['email' => 'Tu usuario está inactivo. Contacta al administrador.']);
        }

        $token = $user->createToken($datos['device_name'] ?? 'app-movil')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => new UsuarioResource($user),
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json(['message' => 'Sesión cerrada.']);
    }

    public function me(Request $request)
    {
        return new UsuarioResource($request->user()->load('rol'));
    }
}
