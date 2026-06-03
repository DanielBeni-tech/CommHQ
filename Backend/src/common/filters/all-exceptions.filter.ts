import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Filtre global d'exceptions : transforme toute erreur en réponse JSON propre.
 *
 * Format de réponse standardisé :
 *   {
 *     "statusCode": 400,
 *     "message": "Email déjà utilisé",
 *     "path": "/api/auth/register",
 *     "timestamp": "2026-06-03T17:00:00.000Z"
 *   }
 *
 * Avantages :
 *   - le frontend reçoit toujours le même format → gestion d'erreur unifiée ;
 *   - les erreurs internes inattendues ne fuient pas vers le client (pas de stack trace).
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Erreur interne du serveur';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : ((exceptionResponse as { message?: string | string[] }).message ??
            exception.message);
    } else if (exception instanceof Error) {
      this.logger.error(`Erreur inattendue : ${exception.message}`, exception.stack);
      message = 'Une erreur inattendue est survenue.';
    } else {
      this.logger.error('Erreur inattendue (non-Error)', JSON.stringify(exception));
    }

    response.status(status).json({
      statusCode: status,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
