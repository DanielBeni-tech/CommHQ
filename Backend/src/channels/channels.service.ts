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
import { Message, MessageDocument } from '../messages/schemas/message.schema';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { sanitizePlainText } from '../common/utils/sanitize.util';

export interface PublicChannel {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  isPrivate: boolean;
  type: 'text';
  createdAt: Date;
}

@Injectable()
export class ChannelsService {
  constructor(
    @InjectModel(Channel.name) private readonly channelModel: Model<ChannelDocument>,
    @InjectModel(Message.name) private readonly messageModel: Model<MessageDocument>,
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
  ): Promise<PublicChannel> {
    if (!Types.ObjectId.isValid(workspaceId)) {
      throw new NotFoundException('Workspace introuvable.');
    }

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

  async listForWorkspace(workspaceId: string, userId: string): Promise<PublicChannel[]> {
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
      createdAt: (c as unknown as { createdAt: Date }).createdAt,
    }));
  }

  /**
   * Met à jour les métadonnées d'un canal (modérateur uniquement).
   */
  async update(
    channelId: string,
    userId: string,
    patch: { name?: string; description?: string; isPrivate?: boolean },
  ): Promise<PublicChannel> {
    const channel = await this.findById(channelId);
    await this.workspacesService.ensureModerator(channel.workspaceId.toString(), userId);

    if (patch.name !== undefined && patch.name !== channel.name) {
      const exists = await this.channelModel
        .exists({
          workspaceId: channel.workspaceId,
          name: patch.name,
          _id: { $ne: channel._id },
        })
        .exec();
      if (exists) {
        throw new ConflictException('Un canal portant ce nom existe déjà dans ce workspace.');
      }
      channel.name = sanitizePlainText(patch.name);
    }
    if (patch.description !== undefined) {
      channel.description = sanitizePlainText(patch.description);
    }
    if (patch.isPrivate !== undefined) {
      channel.isPrivate = patch.isPrivate;
    }

    await channel.save();
    return this.toPublic(channel);
  }

  /**
   * Supprime un canal et tous ses messages (modérateur uniquement).
   * Refuse de supprimer le canal de bienvenue (`general`) pour préserver
   * un point d'entrée minimal dans le workspace.
   */
  async remove(channelId: string, userId: string): Promise<{ workspaceId: string }> {
    const channel = await this.findById(channelId);
    await this.workspacesService.ensureModerator(channel.workspaceId.toString(), userId);

    if (channel.name === 'general') {
      throw new ForbiddenException('Le canal de bienvenue ne peut pas être supprimé.');
    }

    const workspaceId = channel.workspaceId.toString();
    await this.messageModel.deleteMany({ channelId: channel._id }).exec();
    await this.channelModel.deleteOne({ _id: channel._id }).exec();
    return { workspaceId };
  }

  private toPublic(channel: ChannelDocument): PublicChannel {
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
}
