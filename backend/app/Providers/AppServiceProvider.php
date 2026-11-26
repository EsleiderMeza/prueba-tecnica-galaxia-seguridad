<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

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
