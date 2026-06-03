import { Controller, Get, Param, Post } from '@nestjs/common';
import { AiSummaryService } from './ai-summary.service';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

@Controller('channels/:channelId/summary')
export class AiSummaryController {
  constructor(private readonly aiSummaryService: AiSummaryService) {}

  /**
   * Déclenche la génération d'un résumé en 3 phrases du canal.
   * Diffusé en temps réel à tous les membres du canal connectés en WebSocket.
   */
  @Post()
  generate(
    @CurrentUser() current: AuthenticatedUser,
    @Param('channelId') channelId: string,
  ) {
    return this.aiSummaryService.summarizeChannel(channelId, current.userId);
  }

  /**
   * Historique des résumés générés pour ce canal.
   */
  @Get()
  list(
    @CurrentUser() current: AuthenticatedUser,
    @Param('channelId') channelId: string,
  ) {
    return this.aiSummaryService.listForChannel(channelId, current.userId);
  }
}
