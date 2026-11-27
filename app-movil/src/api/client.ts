import Constants from 'expo-constants';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * URL base de la API. Orden de prioridad:
 * 1. Variable de entorno EXPO_PUBLIC_API_URL (archivo .env o EAS).
 * 2. `extra.apiUrl` en app.json.
 */
export const API_URL: string = (
  process.env.EXPO_PUBLIC_API_URL ||
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ||
  'http://10.0.2.2:8000/api'
).replace(/\/+$/, '');

const TOKEN_KEY = 'galaxia_token';

// SecureStore no existe en web; allí se usa localStorage (solo para pruebas).
export const tokenStorage = {
  async get(): Promise<string | null> {
    if (Platform.OS === 'web') return globalThis.localStorage?.getItem(TOKEN_KEY) ?? null;
    return SecureStore.getItemAsync(TOKEN_KEY);
  },
  async set(token: string): Promise<void> {
    if (Platform.OS === 'web') return void globalThis.localStorage?.setItem(TOKEN_KEY, token);
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  },
  async clear(): Promise<void> {
    if (Platform.OS === 'web') return void globalThis.localStorage?.removeItem(TOKEN_KEY);
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  },
};

/** Error normalizado a partir de las respuestas de Laravel. */
export class ApiError extends Error {
  status: number;
  errors: Record<string, string[]>;

  constructor(message: string, status: number, errors: Record<string, string[]> = {}) {
    super(message);
    this.status = status;
    this.errors = errors;
  }

  /** Primer mensaje de validación de un campo (respuesta 422). */
  field(name: string): string | undefined {
    return this.errors[name]?.[0];
  }
}

let currentToken: string | null = null;
let onUnauthorized: ((message?: string) => void) | null = null;

export function setToken(token: string | null) {
  currentToken = token;
}

export function setUnauthorizedHandler(handler: ((message?: string) => void) | null) {
  onUnauthorized = handler;
}

type Query = Record<string, string | number | boolean | null | undefined>;

function buildUrl(path: string, query?: Query): string {
  const url = `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
  if (!query) return url;
  const params = Object.entries(query)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  return params.length ? `${url}?${params.join('&')}` : url;
}

// 60 s: el plan gratuito de Render "duerme" el servidor y tarda hasta ~1 min en despertar.
const TIMEOUT_MS = 60000;

export async function request<T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  options: { body?: unknown; query?: Query } = {},
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (currentToken) headers.Authorization = `Bearer ${currentToken}`;

  let response: Response;
  try {
    response = await fetch(buildUrl(path, options.query), {
      method,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });
  } catch (e) {
    const aborted = e instanceof Error && e.name === 'AbortError';
    throw new ApiError(
      aborted
        ? 'El servidor tardó demasiado en responder (puede estar despertando). Intenta de nuevo en unos segundos.'
        : 'No se pudo conectar con el servidor. Revisa tu conexión a internet.',
      0,
    );
  } finally {
    clearTimeout(timer);
  }

  const text = await response.text();
  let json: any = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
  }

  if (!response.ok) {
    if (response.status === 401 && onUnauthorized && path !== '/login') onUnauthorized(json?.message);
    const fallback: Record<number, string> = {
      401: 'Tu sesión expiró. Inicia sesión de nuevo.',
      403: 'No tienes permiso para realizar esta acción.',
      404: 'El recurso solicitado no existe.',
      422: 'Revisa los datos ingresados.',
      429: 'Demasiados intentos. Espera un momento.',
      500: 'Error interno del servidor.',
    };
    throw new ApiError(
      json?.message || fallback[response.status] || `Error ${response.status}`,
      response.status,
      json?.errors ?? {},
    );
  }

  return json as T;
}

export const api = {
  get: <T>(path: string, query?: Query) => request<T>('GET', path, { query }),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, { body: body ?? {} }),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, { body }),
  delete: <T>(path: string) => request<T>('DELETE', path),
};

export function errorMessage(e: unknown): string {
  if (e instanceof ApiError) return e.message;
  if (e instanceof Error) return e.message;
  return 'Ocurrió un error inesperado.';
}
