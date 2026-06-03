import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ChannelsService } from './channels.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

@Controller()
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  /**
   * Crée un canal dans un workspace (modérateur uniquement).
   */
  @Post('workspaces/:workspaceId/channels')
  create(
    @CurrentUser() current: AuthenticatedUser,
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateChannelDto,
  ) {
    return this.channelsService.create(workspaceId, current.userId, dto);
  }

  /**
   * Liste les canaux d'un workspace pour l'utilisateur courant.
   */
  @Get('workspaces/:workspaceId/channels')
  list(
    @CurrentUser() current: AuthenticatedUser,
    @Param('workspaceId') workspaceId: string,
  ) {
    return this.channelsService.listForWorkspace(workspaceId, current.userId);
  }

  @Get('channels/:id')
  async get(
    @CurrentUser() current: AuthenticatedUser,
    @Param('id') channelId: string,
  ) {
    const channel = await this.channelsService.ensureAccess(channelId, current.userId);
    return {
      id: channel._id.toString(),
      workspaceId: channel.workspaceId.toString(),
      name: channel.name,
      description: channel.description,
      isPrivate: channel.isPrivate,
      type: channel.type,
    };
  }
}
