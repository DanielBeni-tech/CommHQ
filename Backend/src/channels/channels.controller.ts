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
} from '@nestjs/common';
import { ChannelsService } from './channels.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
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
      createdAt: (channel as unknown as { createdAt: Date }).createdAt,
    };
  }

  /**
   * Renomme ou met à jour un canal (modérateur uniquement).
   */
  @Patch('channels/:id')
  update(
    @CurrentUser() current: AuthenticatedUser,
    @Param('id') channelId: string,
    @Body() dto: UpdateChannelDto,
  ) {
    return this.channelsService.update(channelId, current.userId, dto);
  }

  /**
   * Supprime un canal et tous ses messages (modérateur uniquement).
   * Le canal `general` est protégé.
   */
  @Delete('channels/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() current: AuthenticatedUser,
    @Param('id') channelId: string,
  ): Promise<void> {
    await this.channelsService.remove(channelId, current.userId);
  }
}
