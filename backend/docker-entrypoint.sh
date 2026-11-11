#!/bin/sh
set -e

echo "=========================================================="
echo "🚀 [Skylearn Backend] Iniciando verificaciones previas..."
echo "=========================================================="

# Esperar a que la base de datos PostgreSQL acepte conexiones
echo "⏳ Esperando conexión con PostgreSQL..."
node -e "
const net = require('net');
const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('ERROR: DATABASE_URL no está definida.');
  process.exit(1);
}

try {
  const parsed = new URL(dbUrl);
  const host = parsed.hostname;
  const port = parseInt(parsed.port || '5432', 10);

  let attempts = 0;
  const maxAttempts = 30;

  function tryConnect() {
    attempts++;
    const socket = net.connect({ host, port }, () => {
      console.log('✅ PostgreSQL está disponible en ' + host + ':' + port);
      socket.end();
      process.exit(0);
    });

    socket.on('error', (err) => {
      if (attempts >= maxAttempts) {
        console.error('❌ Tiempo de espera agotado conectando a PostgreSQL (' + host + ':' + port + ')');
        process.exit(1);
      }
      setTimeout(tryConnect, 1500);
    });
  }

  tryConnect();
} catch (e) {
  console.error('Error parseando DATABASE_URL:', e.message);
  process.exit(1);
}
"

# Sincronizar el esquema de Prisma con PostgreSQL
echo "📦 Aplicando esquema de base de datos con Prisma..."
npx prisma db push --skip-generate

# Ejecutar seed de datos de prueba si RUN_SEED es true
if [ "$RUN_SEED" = "true" ]; then
  echo "🌱 RUN_SEED=true: Sembrando datos iniciales en la base de datos..."
  npm run db:seed || echo "⚠️ Advertencia: El seed falló o ya existían registros."
else
  echo "ℹ️ RUN_SEED no es true. Omitiendo la siembra de datos demo."
fi

echo "=========================================================="
echo "🎯 [Skylearn Backend] Todo listo. Arrancando servidor..."
echo "=========================================================="

exec "$@"

