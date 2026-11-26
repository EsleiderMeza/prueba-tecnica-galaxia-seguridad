#!/bin/sh
# Arranque del contenedor: prepara Laravel, migra la base de datos y levanta Apache.
set -e

# Render entrega el puerto en $PORT (por defecto 10000).
PORT="${PORT:-10000}"
sed -ri "s/^Listen .*/Listen ${PORT}/" /etc/apache2/ports.conf
sed -ri "s/<VirtualHost \*:[0-9]+>/<VirtualHost *:${PORT}>/" /etc/apache2/sites-available/000-default.conf

# Render genera APP_KEY como base64 sin el prefijo que Laravel espera.
if [ -z "$APP_KEY" ]; then
  echo "ERROR: falta la variable APP_KEY" >&2
  exit 1
fi
case "$APP_KEY" in
  base64:*) ;;
  *) export APP_KEY="base64:${APP_KEY}" ;;
esac

# Neon: el host "-pooler" pasa por PgBouncer en modo transacción, que rompe las
# migraciones de Laravel. Se usa siempre la conexión directa (sin "-pooler").
if [ -n "$DB_URL" ]; then
  export DB_URL="$(printf '%s' "$DB_URL" | sed 's/-pooler\././')"
fi

php artisan config:cache
php artisan route:cache
php artisan view:cache

# Crea o actualiza las tablas y carga los datos de prueba solo la primera vez.
php artisan migrate --force
php artisan app:seed-if-empty

chown -R www-data:www-data storage bootstrap/cache
exec apache2-foreground
