<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;
use Laravel\Sanctum\Sanctum;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // En producción todas las URL que genera Laravel usan HTTPS.
        if ($this->app->environment('production')) {
            URL::forceScheme('https');
        }

        // Cierre por inactividad: si el token no se usó en los últimos N minutos se borra
        // y la API responde 401. Sanctum guarda en last_used_at la hora del último uso.
        Sanctum::authenticateAccessTokensUsing(function ($token, bool $isValid) {
            $minutos = (int) config('sanctum.idle_minutes');
            $ultimoUso = $token->last_used_at ?? $token->created_at;

            if ($isValid && $minutos > 0 && $ultimoUso && $ultimoUso->lt(now()->subMinutes($minutos))) {
                $token->delete();
                request()->attributes->set('sesion_inactiva', true);

                return false;
            }

            return $isValid;
        });

        // Login: máximo 5 intentos por minuto por correo + IP (frena ataques de fuerza bruta).
        RateLimiter::for('login', function (Request $request) {
            $correo = mb_strtolower((string) $request->input('email'));

            return Limit::perMinute(5)->by($correo.'|'.$request->ip());
        });

        // Resto de la API: 120 peticiones por minuto por usuario (o por IP si no hay sesión).
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(120)->by($request->user()?->id ?: $request->ip());
        });
    }
}
