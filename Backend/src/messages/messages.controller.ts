import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { MessagesGateway } from './messages.gateway';

@Controller()
export class MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly messagesGateway: MessagesGateway,
  ) {}

  /**
   * Envoi d'un message via HTTP (fallback si le client n'utilise pas WebSocket).
   * On diffuse aussi via la passerelle pour que les autres clients reçoivent l'event temps réel.
   */
  @Post('channels/:channelId/messages')
  async create(
    @CurrentUser() current: AuthenticatedUser,
    @Param('channelId') channelId: string,
    @Body() dto: CreateMessageDto,
  ) {
    const message = await this.messagesService.create(channelId, current.userId, dto.content);
    this.messagesGateway.broadcastNewMessage(message);
    return message;
  }

  @Get('channels/:channelId/messages')
  list(
    @CurrentUser() current: AuthenticatedUser,
    @Param('channelId') channelId: string,
    @Query('before') before?: string,
    @Query('limit') limit?: string,
    @Query('pinned') pinned?: string,
  ) {
    return this.messagesService.listForChannel(channelId, current.userId, {
      before,
      limit: limit ? parseInt(limit, 10) : undefined,
      pinnedOnly: pinned === 'true',
    });
  }

  @Patch('messages/:messageId')
  async update(
    @CurrentUser() current: AuthenticatedUser,
    @Param('messageId') messageId: string,
    @Body() dto: UpdateMessageDto,
  ) {
    const message = await this.messagesService.update(messageId, current.userId, dto.content);
    this.messagesGateway.broadcastUpdatedMessage(message);
    return message;
  }

  @Delete('messages/:messageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() current: AuthenticatedUser,
    @Param('messageId') messageId: string,
  ) {
    const { channelId } = await this.messagesService.remove(messageId, current.userId);
    this.messagesGateway.broadcastDeletedMessage(channelId, messageId);
  }

  /**
   * Épingle un message (modérateur du workspace).
   */
  @Post('messages/:messageId/pin')
  async pin(
    @CurrentUser() current: AuthenticatedUser,
    @Param('messageId') messageId: string,
  ) {
    const message = await this.messagesService.setPinned(messageId, current.userId, true);
    this.messagesGateway.broadcastUpdatedMessage(message);
    return message;
  }

  /**
   * Désépingle un message.
   */
  @Post('messages/:messageId/unpin')
  async unpin(
    @CurrentUser() current: AuthenticatedUser,
    @Param('messageId') messageId: string,
  ) {
    const message = await this.messagesService.setPinned(messageId, current.userId, false);
    this.messagesGateway.broadcastUpdatedMessage(message);
    return message;
  }
}
