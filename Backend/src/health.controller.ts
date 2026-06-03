import { Controller, Get } from '@nestjs/common';
import { Public } from './common/decorators/public.decorator';

/**
 * Endpoint de santé : utile pour Docker / orchestrateur et pour vérifier
 * rapidement que le serveur répond. Ne nécessite pas d'authentification.
 */
@Controller('health')
export class HealthController {
  @Public()
  @Get()
  check(): { status: string; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
