import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Channel, ChannelDocument } from './schemas/channel.schema';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { sanitizePlainText } from '../common/utils/sanitize.util';

@Injectable()
export class ChannelsService {
  constructor(
    @InjectModel(Channel.name) private readonly channelModel: Model<ChannelDocument>,
    @Inject(forwardRef(() => WorkspacesService))
    private readonly workspacesService: WorkspacesService,
  ) {}

  /**
   * Création d'un canal.
   * - Doit être déclenchée par un MODÉRATEUR du workspace,
   *   sauf cas spécial : création du canal de bienvenue par WorkspacesService
   *   au moment de la création du workspace (le créateur vient de devenir modérateur).
   */
  async create(
    workspaceId: string,
    requesterId: string,
    dto: { name: string; description?: string; isPrivate?: boolean },
  ) {
    if (!Types.ObjectId.isValid(workspaceId)) {
      throw new NotFoundException('Workspace introuvable.');
    }

    // Vérifie que le demandeur est modérateur (sauf si c'est le owner et le 1er canal).
    await this.workspacesService.ensureModerator(workspaceId, requesterId);

    const exists = await this.channelModel
      .exists({ workspaceId: new Types.ObjectId(workspaceId), name: dto.name })
      .exec();
    if (exists) {
      throw new ConflictException('Un canal portant ce nom existe déjà dans ce workspace.');
    }

    const channel = await this.channelModel.create({
      workspaceId: new Types.ObjectId(workspaceId),
      name: sanitizePlainText(dto.name),
      description: dto.description ? sanitizePlainText(dto.description) : '',
      isPrivate: dto.isPrivate ?? false,
    });
    return this.toPublic(channel);
  }

  async findById(channelId: string): Promise<ChannelDocument> {
    if (!Types.ObjectId.isValid(channelId)) {
      throw new NotFoundException('Canal introuvable.');
    }
    const channel = await this.channelModel.findById(channelId).exec();
    if (!channel) {
      throw new NotFoundException('Canal introuvable.');
    }
    return channel;
  }

  /**
   * Vérifie qu'un utilisateur peut accéder à un canal : il doit être membre du workspace.
   * Retourne le canal pour la suite du traitement.
   */
  async ensureAccess(channelId: string, userId: string): Promise<ChannelDocument> {
    const channel = await this.findById(channelId);
    const role = await this.workspacesService.getMemberRole(
      channel.workspaceId.toString(),
      userId,
    );
    if (!role) {
      throw new ForbiddenException("Vous n'avez pas accès à ce canal.");
    }
    return channel;
  }

  async listForWorkspace(workspaceId: string, userId: string) {
    await this.workspacesService.ensureMember(workspaceId, userId);
    const channels = await this.channelModel
      .find({ workspaceId: new Types.ObjectId(workspaceId) })
      .sort({ order: 1, createdAt: 1 })
      .lean()
      .exec();
    return channels.map((c) => ({
      id: c._id.toString(),
      workspaceId: c.workspaceId.toString(),
      name: c.name,
      description: c.description,
      isPrivate: c.isPrivate,
      type: c.type,
    }));
  }

  private toPublic(channel: ChannelDocument) {
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
