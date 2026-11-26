<?php

use App\Http\Middleware\VerificarRol;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/** Nombres legibles de los modelos para los mensajes 404. */
$nombres = [
    'Equipo' => 'El equipo', 'Solicitud' => 'La solicitud', 'User' => 'El usuario',
    'Categoria' => 'La categoría', 'Estado' => 'El estado', 'Rol' => 'El rol',
];

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias(['rol' => VerificarRol::class]);
        $middleware->trustProxies(at: '*'); // detrás del proxy HTTPS del hosting
    })
    ->withExceptions(function (Exceptions $exceptions) use ($nombres): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        // Todas las respuestas de error de la API son JSON con "message" (y "errors" en 422).
        $exceptions->render(function (Throwable $e, Request $request) use ($nombres) {
            if (! ($request->is('api/*') || $request->expectsJson())) {
                return null;
            }

            if ($e instanceof ValidationException) {
                return response()->json([
                    'message' => collect($e->errors())->flatten()->first() ?? 'Los datos enviados no son válidos.',
                    'errors' => $e->errors(),
                ], $e->status);
            }

            if ($e instanceof AuthenticationException) {
                return response()->json(['message' => 'Unauthenticated.'], 401);
            }

            if ($e instanceof AuthorizationException || $e instanceof AccessDeniedHttpException) {
                $msg = $e->getMessage();

                return response()->json([
                    'message' => $msg && $msg !== 'This action is unauthorized.' ? $msg : 'No tienes permiso para realizar esta acción.',
                ], 403);
            }

            if ($e instanceof NotFoundHttpException) {
                $previo = $e->getPrevious();
                if ($previo instanceof ModelNotFoundException) {
                    $modelo = class_basename($previo->getModel());

                    return response()->json(['message' => ($nombres[$modelo] ?? 'El recurso').' no existe.'], 404);
                }

                return response()->json(['message' => $e->getMessage() ?: 'Ruta no encontrada.'], 404);
            }

            if ($e instanceof MethodNotAllowedHttpException) {
                return response()->json(['message' => 'Método HTTP no permitido para esta ruta.'], 405);
            }

            if ($e instanceof ThrottleRequestsException) {
                return response()->json(['message' => 'Demasiados intentos. Espera un minuto e intenta de nuevo.'], 429);
            }

            if ($e instanceof HttpExceptionInterface) {
                return response()->json(['message' => $e->getMessage() ?: 'Error en la solicitud.'], $e->getStatusCode());
            }

            if ($e instanceof QueryException && in_array($e->getCode(), ['23000', '23503', '23505'], true)) {
                return response()->json(['message' => 'La operación viola una restricción de la base de datos (registro duplicado o en uso).'], 409);
            }

            return response()->json([
                'message' => config('app.debug') ? $e->getMessage() : 'Error interno del servidor. Intenta de nuevo más tarde.',
            ], 500);
        });
    })->create();
