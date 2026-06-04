import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Message, MessageDocument } from './schemas/message.schema';
import { ChannelsService } from '../channels/channels.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { UsersService } from '../users/users.service';
import { sanitizeMarkdownContent } from '../common/utils/sanitize.util';

export interface PublicAuthor {
  id: string;
  name: string;
  avatarUrl: string;
}

export interface PublicMessage {
  id: string;
  channelId: string;
  authorId: string;
  /** Métadonnées de l'auteur, embarquées pour éviter un round-trip côté client. */
  author: PublicAuthor;
  content: string;
  pinned: boolean;
  editedAt: Date | null;
  createdAt: Date;
}

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Message.name) private readonly messageModel: Model<MessageDocument>,
    private readonly channelsService: ChannelsService,
    private readonly workspacesService: WorkspacesService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Crée un message dans un canal.
   * - Vérifie l'accès de l'utilisateur au canal.
   * - Sanitise le contenu Markdown contre le XSS.
   * - Embarque les métadonnées de l'auteur dans la réponse pour éviter
   *   un appel additionnel côté client.
   */
  async create(channelId: string, authorId: string, content: string): Promise<PublicMessage> {
    await this.channelsService.ensureAccess(channelId, authorId);

    const sanitized = sanitizeMarkdownContent(content);
    if (!sanitized) {
      throw new BadRequestException('Le message est vide après nettoyage.');
    }

    const message = await this.messageModel.create({
      channelId: new Types.ObjectId(channelId),
      authorId: new Types.ObjectId(authorId),
      content: sanitized,
    });

    const author = await this.loadAuthor(authorId);
    return this.toPublic(message, author);
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
      .populate<{ authorId: { _id: Types.ObjectId; name: string; avatarUrl?: string } }>(
        'authorId',
        'name avatarUrl',
      )
      .lean()
      .exec();

    // On renverse pour livrer du plus ancien au plus récent (plus naturel à afficher).
    return docs.reverse().map((d) => {
      const populated = d.authorId as unknown as {
        _id: Types.ObjectId;
        name?: string;
        avatarUrl?: string;
      } | null;
      const author: PublicAuthor = populated
        ? {
            id: populated._id.toString(),
            name: populated.name ?? 'Utilisateur',
            avatarUrl: populated.avatarUrl ?? '',
          }
        : { id: '', name: 'Utilisateur', avatarUrl: '' };

      return {
        id: (d._id as Types.ObjectId).toString(),
        channelId: d.channelId.toString(),
        authorId: author.id,
        author,
        content: d.content,
        pinned: d.pinned,
        editedAt: d.editedAt ?? null,
        createdAt: (d as unknown as { createdAt: Date }).createdAt,
      };
    });
  }

  /**
   * Récupère les N derniers messages d'un canal. Utilisé par le bot IA.
   * Retourne des documents Mongoose lean avec `authorId` peuplé en `{ name }`.
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
      throw new ForbiddenException('Vous ne pouvez modifier que vos propres messages.');
    }

    const sanitized = sanitizeMarkdownContent(content);
    if (!sanitized) {
      throw new BadRequestException('Le message est vide après nettoyage.');
    }

    message.content = sanitized;
    message.editedAt = new Date();
    await message.save();

    const author = await this.loadAuthor(message.authorId.toString());
    return this.toPublic(message, author);
  }

  /**
   * Suppression logique (soft delete) — l'historique reste cohérent côté client.
   * Auteur OU modérateur du workspace.
   *
   * Retourne le `channelId` pour permettre au contrôleur de diffuser
   * `message:deleted` uniquement aux sockets du canal concerné.
   */
  async remove(messageId: string, userId: string): Promise<{ channelId: string }> {
    const message = await this.findById(messageId);
    const isAuthor = message.authorId.toString() === userId;

    if (!isAuthor) {
      const channel = await this.channelsService.findById(message.channelId.toString());
      await this.workspacesService.ensureModerator(channel.workspaceId.toString(), userId);
    }

    message.isDeleted = true;
    message.content = '[message supprimé]';
    await message.save();

    return { channelId: message.channelId.toString() };
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

    const author = await this.loadAuthor(message.authorId.toString());
    return this.toPublic(message, author);
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

  /**
   * Charge les métadonnées publiques d'un auteur. Si l'utilisateur a été
   * supprimé entre-temps, on retourne un placeholder pour ne pas casser l'UI.
   */
  private async loadAuthor(userId: string): Promise<PublicAuthor> {
    const user = await this.usersService.findById(userId).catch(() => null);
    if (!user) {
      return { id: userId, name: 'Utilisateur supprimé', avatarUrl: '' };
    }
    return {
      id: user._id.toString(),
      name: user.name,
      avatarUrl: user.avatarUrl ?? '',
    };
  }

  toPublic(message: MessageDocument, author: PublicAuthor): PublicMessage {
    return {
      id: message._id.toString(),
      channelId: message.channelId.toString(),
      authorId: message.authorId.toString(),
      author,
      content: message.content,
      pinned: message.pinned,
      editedAt: message.editedAt ?? null,
      createdAt: (message as unknown as { createdAt: Date }).createdAt,
    };
  }
}
