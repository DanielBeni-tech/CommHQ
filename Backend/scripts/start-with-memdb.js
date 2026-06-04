/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Démarre une base MongoDB en mémoire (via mongodb-memory-server) puis
 * lance le backend NestJS contre cette instance.
 *
 * Utile pour la démo / hackathon : zéro installation MongoDB requise.
 * Les données ne sont PAS persistées entre deux exécutions — c'est attendu
 * pour la démo.
 *
 * Usage : npm run start:demo
 */
const path = require('node:path');
const { spawn } = require('node:child_process');
const { MongoMemoryServer } = require('mongodb-memory-server');

async function main() {
  // eslint-disable-next-line no-console
  console.log('🌱  Démarrage de MongoDB en mémoire…');
  const mongo = await MongoMemoryServer.create({
    instance: { dbName: 'commhq' },
  });
  const uri = mongo.getUri();
  // eslint-disable-next-line no-console
  console.log(`✅  MongoDB disponible sur ${uri}`);

  const env = {
    ...process.env,
    MONGODB_URI: uri,
    PORT: process.env.PORT ?? '3000',
    CORS_ORIGIN: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    JWT_SECRET: process.env.JWT_SECRET ?? 'demo-jwt-secret-change-me',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '1d',
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ?? 'demo-refresh-secret',
    JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
    INVITATION_TTL_HOURS: process.env.INVITATION_TTL_HOURS ?? '72',
    FRONTEND_URL: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    AI_PROVIDER: process.env.AI_PROVIDER ?? 'mock',
    // En mode démo, on amorce un compte/workspace prêts à l'emploi pour
    // que les identifiants pré-remplis du frontend fonctionnent immédiatement.
    SEED_DEMO: process.env.SEED_DEMO ?? 'true',
  };

  // On invoque le CLI Nest via Node directement pour rester insensible
  // aux chemins contenant des espaces (cas typique sous Windows).
  const nestCliEntry = path.resolve(
    __dirname,
    '..',
    'node_modules',
    '@nestjs',
    'cli',
    'bin',
    'nest.js',
  );
  const child = spawn(process.execPath, [nestCliEntry, 'start', '--watch'], {
    cwd: path.resolve(__dirname, '..'),
    env,
    stdio: 'inherit',
  });

  const cleanup = async (code) => {
    try {
      await mongo.stop();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('Arrêt de MongoDB en mémoire impossible :', err);
    }
    process.exit(code ?? 0);
  };

  child.on('exit', (code) => cleanup(code ?? 0));
  process.on('SIGINT', () => cleanup(0));
  process.on('SIGTERM', () => cleanup(0));
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Échec du démarrage :', err);
  process.exit(1);
});
