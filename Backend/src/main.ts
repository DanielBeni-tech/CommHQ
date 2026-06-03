import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

/**
 * Point d'entrée du backend CommHQ.
 *
 * Étapes :
 *  1) Création de l'application NestJS à partir du module racine.
 *  2) Activation de la validation globale (toutes les entrées DTO sont vérifiées).
 *  3) Configuration du CORS pour autoriser le frontend.
 *  4) Filtre global qui transforme les exceptions en réponses JSON propres.
 *  5) Démarrage sur le port configuré.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    // Logger Nest par défaut, suffisant en hackathon.
    logger: ['log', 'warn', 'error', 'debug'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') ?? 3000;
  const corsOrigin = configService.get<string>('corsOrigin') ?? '*';

  // CORS : on autorise uniquement l'origine du frontend (configurable via .env).
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  // Validation stricte : toutes les requêtes passent par class-validator.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // supprime les champs non déclarés dans le DTO
      forbidNonWhitelisted: true, // refuse une requête contenant des champs inconnus
      transform: true, // transforme les payloads en instances de classes DTO
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  // Préfixe /api pour bien séparer l'API REST du reste.
  app.setGlobalPrefix('api', { exclude: ['health'] });

  await app.listen(port);
  Logger.log(`🚀 CommHQ backend démarré sur http://localhost:${port}/api`, 'Bootstrap');
}

bootstrap().catch((error) => {
  Logger.error('Échec du démarrage du serveur', error, 'Bootstrap');
  process.exit(1);
});
