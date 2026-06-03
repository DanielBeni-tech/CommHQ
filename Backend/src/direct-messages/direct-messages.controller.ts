import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { DirectMessagesService } from './direct-messages.service';
import { CreateDirectMessageDto } from './dto/create-direct-message.dto';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

@Controller('direct-messages')
export class DirectMessagesController {
  constructor(private readonly directMessagesService: DirectMessagesService) {}

  /**
   * Envoi d'un message direct (DM).
   */
  @Post()
  send(
    @CurrentUser() current: AuthenticatedUser,
    @Body() dto: CreateDirectMessageDto,
  ) {
    return this.directMessagesService.send(current.userId, dto.toUserId, dto.content);
  }

  /**
   * Liste des conversations récentes (panneau latéral des DM).
   */
  @Get()
  listConversations(@CurrentUser() current: AuthenticatedUser) {
    return this.directMessagesService.listRecentConversations(current.userId);
  }

  /**
   * Conversation complète avec un autre utilisateur.
   */
  @Get(':otherUserId')
  conversation(
    @CurrentUser() current: AuthenticatedUser,
    @Param('otherUserId') otherUserId: string,
    @Query('before') before?: string,
    @Query('limit') limit?: string,
  ) {
    return this.directMessagesService.listConversation(current.userId, otherUserId, {
      before,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Post(':messageId/read')
  read(
    @CurrentUser() current: AuthenticatedUser,
    @Param('messageId') messageId: string,
  ) {
    return this.directMessagesService.markAsRead(messageId, current.userId);
  }
}
