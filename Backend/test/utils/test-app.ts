import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  Logger,
} from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { MongoMemoryServer } from 'mongodb-memory-server';
import * as net from 'net';

import { AppModule } from '../../src/app.module';
import { AllExceptionsFilter } from '../../src/common/filters/all-exceptions.filter';

/**
 * Trouve un port TCP libre sur la machine locale.
 * Utile pour faire tourner plusieurs suites de tests en parallèle sans collision.
 */
async function findAvailablePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      server.close(() => resolve(port));
    });
  });
}

export interface TestAppHandle {
  app: INestApplication;
  baseUrl: string;
  port: number;
  mongoUri: string;
  close: () => Promise<void>;
}

/**
 * Démarre une instance de l'application NestJS pour les tests e2e.
 *
 * - MongoDB en mémoire (mongodb-memory-server) : isolation complète, pas
 *   besoin d'une base externe.
 * - Adaptateur Socket.IO activé pour pouvoir tester la passerelle WebSocket.
 * - Variables d'environnement minimales fournies via `process.env`
 *   AVANT `Test.createTestingModule` afin que `configuration.ts` les voie.
 *
 * À fermer via `handle.close()` à la fin de chaque suite (`afterAll`).
 */
export async function createTestApp(): Promise<TestAppHandle> {
  // Le logger Nest est très verbeux ; on le réduit pendant les tests.
  Logger.overrideLogger(['error', 'warn']);

  const mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  process.env.MONGODB_URI = mongoUri;
  process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-jwt-secret-very-long-and-random';
  process.env.JWT_REFRESH_SECRET =
    process.env.JWT_REFRESH_SECRET ?? 'test-jwt-refresh-secret-very-long-and-random';
  process.env.JWT_EXPIRES_IN = '1h';
  process.env.JWT_REFRESH_EXPIRES_IN = '7d';
  process.env.AI_PROVIDER = 'mock';
  process.env.INVITATION_TTL_HOURS = '72';
  process.env.FRONTEND_URL = 'http://localhost:5173';

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.setGlobalPrefix('api', { exclude: ['health'] });
  app.useWebSocketAdapter(new IoAdapter(app));

  const port = await findAvailablePort();
  await app.listen(port);

  return {
    app,
    port,
    baseUrl: `http://127.0.0.1:${port}`,
    mongoUri,
    close: async () => {
      await app.close();
      await mongoServer.stop();
    },
  };
}
