import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Message, MessageDocument } from './schemas/message.schema';
import { ChannelsService } from '../channels/channels.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { sanitizeMarkdownContent } from '../common/utils/sanitize.util';

export interface PublicMessage {
  id: string;
  channelId: string;
  authorId: string;
  content: string;
  pinned: boolean;
  editedAt: Date | null;
  createdAt: Date;
}

/**
 * Pagination par défaut : on garde des pages courtes pour rester
 * sous la barre des 300 ms de latence (cf. cahier des charges NF-2).
 */
const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Message.name) private readonly messageModel: Model<MessageDocument>,
    private readonly channelsService: ChannelsService,
    private readonly workspacesService: WorkspacesService,
  ) {}

  /**
   * Crée un message dans un canal.
   * - Vérifie l'accès de l'utilisateur au canal.
   * - Sanitise le contenu Markdown contre le XSS.
   */
  async create(channelId: string, authorId: string, content: string): Promise<PublicMessage> {
    await this.channelsService.ensureAccess(channelId, authorId);

    const sanitized = sanitizeMarkdownContent(content);
    if (!sanitized) {
      throw new ForbiddenException("Le message est vide après nettoyage.");
    }

    const message = await this.messageModel.create({
      channelId: new Types.ObjectId(channelId),
      authorId: new Types.ObjectId(authorId),
      content: sanitized,
    });

    return this.toPublic(message);
  }

  /**
   * Historique paginé d'un canal (du plus récent au plus ancien).
   * Curseur basé sur la date de création — plus efficace qu'un offset.
   */
  async listForChannel(
    channelId: string,
    userId: string,
    options: { before?: string; limit?: number; pinnedOnly?: boolean } = {},
  ): Promise<PublicMessage[]> {
    await this.channelsService.ensureAccess(channelId, userId);

    const limit = Math.min(options.limit ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
    const filter: Record<string, unknown> = {
      channelId: new Types.ObjectId(channelId),
      isDeleted: false,
    };
    if (options.pinnedOnly) filter.pinned = true;
    if (options.before) {
      const beforeDate = new Date(options.before);
      if (!Number.isNaN(beforeDate.getTime())) {
        filter.createdAt = { $lt: beforeDate };
      }
    }

    const docs = await this.messageModel
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
      .exec();

    // On renverse pour livrer du plus ancien au plus récent (plus naturel à afficher).
    return docs.reverse().map((d) => ({
      id: (d._id as Types.ObjectId).toString(),
      channelId: d.channelId.toString(),
      authorId: d.authorId.toString(),
      content: d.content,
      pinned: d.pinned,
      editedAt: d.editedAt ?? null,
      createdAt: (d as unknown as { createdAt: Date }).createdAt,
    }));
  }

  /**
   * Récupère les N derniers messages d'un canal. Utilisé par le bot IA.
   */
  async getRecentForSummary(channelId: string, limit = 100) {
    return this.messageModel
      .find({ channelId: new Types.ObjectId(channelId), isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('authorId', 'name')
      .lean()
      .exec();
  }

  /**
   * Édition d'un message.
   * Seul l'auteur peut éditer son message.
   */
  async update(messageId: string, userId: string, content: string): Promise<PublicMessage> {
    const message = await this.findById(messageId);
    if (message.authorId.toString() !== userId) {
      throw new ForbiddenException("Vous ne pouvez modifier que vos propres messages.");
    }

    const sanitized = sanitizeMarkdownContent(content);
    if (!sanitized) {
      throw new ForbiddenException("Le message est vide après nettoyage.");
    }

    message.content = sanitized;
    message.editedAt = new Date();
    await message.save();

    return this.toPublic(message);
  }

  /**
   * Suppression logique (soft delete) — l'historique reste cohérent côté client.
   * Auteur OU modérateur du workspace.
   */
  async remove(messageId: string, userId: string): Promise<void> {
    const message = await this.findById(messageId);
    const isAuthor = message.authorId.toString() === userId;

    if (!isAuthor) {
      // Vérification supplémentaire : autoriser un modérateur du workspace.
      const channel = await this.channelsService.findById(message.channelId.toString());
      await this.workspacesService.ensureModerator(channel.workspaceId.toString(), userId);
    }

    message.isDeleted = true;
    message.content = '[message supprimé]';
    await message.save();
  }

  /**
   * Épinglage / désépinglage d'un message (modérateur uniquement).
   */
  async setPinned(messageId: string, userId: string, pinned: boolean): Promise<PublicMessage> {
    const message = await this.findById(messageId);
    const channel = await this.channelsService.findById(message.channelId.toString());
    await this.workspacesService.ensureModerator(channel.workspaceId.toString(), userId);

    message.pinned = pinned;
    await message.save();
    return this.toPublic(message);
  }

  async findById(messageId: string): Promise<MessageDocument> {
    if (!Types.ObjectId.isValid(messageId)) {
      throw new NotFoundException('Message introuvable.');
    }
    const message = await this.messageModel.findById(messageId).exec();
    if (!message) {
      throw new NotFoundException('Message introuvable.');
    }
    return message;
  }

  toPublic(message: MessageDocument): PublicMessage {
    return {
      id: message._id.toString(),
      channelId: message.channelId.toString(),
      authorId: message.authorId.toString(),
      content: message.content,
      pinned: message.pinned,
      editedAt: message.editedAt ?? null,
      createdAt: (message as unknown as { createdAt: Date }).createdAt,
    };
  }
}
