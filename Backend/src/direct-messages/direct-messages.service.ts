import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  DirectMessage,
  DirectMessageDocument,
} from './schemas/direct-message.schema';
import { UsersService } from '../users/users.service';
import { sanitizeMarkdownContent } from '../common/utils/sanitize.util';

@Injectable()
export class DirectMessagesService {
  constructor(
    @InjectModel(DirectMessage.name)
    private readonly model: Model<DirectMessageDocument>,
    private readonly usersService: UsersService,
  ) {}

  async send(fromUserId: string, toUserId: string, rawContent: string) {
    if (fromUserId === toUserId) {
      throw new BadRequestException('Vous ne pouvez pas vous envoyer un message.');
    }
    // Vérifie que le destinataire existe.
    await this.usersService.findById(toUserId);

    const content = sanitizeMarkdownContent(rawContent);
    if (!content) {
      throw new BadRequestException('Le message est vide après nettoyage.');
    }

    const message = await this.model.create({
      fromUserId: new Types.ObjectId(fromUserId),
      toUserId: new Types.ObjectId(toUserId),
      content,
    });

    return this.toPublic(message);
  }

  /**
   * Conversation entre deux utilisateurs (les deux sens).
   */
  async listConversation(
    currentUserId: string,
    otherUserId: string,
    options: { limit?: number; before?: string } = {},
  ) {
    if (!Types.ObjectId.isValid(otherUserId)) {
      throw new BadRequestException('Identifiant utilisateur invalide.');
    }
    const me = new Types.ObjectId(currentUserId);
    const other = new Types.ObjectId(otherUserId);

    const filter: Record<string, unknown> = {
      $or: [
        { fromUserId: me, toUserId: other },
        { fromUserId: other, toUserId: me },
      ],
    };
    if (options.before) {
      const beforeDate = new Date(options.before);
      if (!Number.isNaN(beforeDate.getTime())) {
        filter.createdAt = { $lt: beforeDate };
      }
    }

    const limit = Math.min(options.limit ?? 50, 100);
    const docs = await this.model
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
      .exec();

    return docs.reverse().map((d) => this.toPublicLean(d));
  }

  /**
   * Renvoie la liste des conversations récentes de l'utilisateur courant
   * (un aperçu par interlocuteur).
   */
  async listRecentConversations(currentUserId: string) {
    const me = new Types.ObjectId(currentUserId);

    // Agrégation : on regroupe par (autre utilisateur) et on garde le dernier message.
    const rows = await this.model.aggregate([
      { $match: { $or: [{ fromUserId: me }, { toUserId: me }] } },
      { $sort: { createdAt: -1 } },
      {
        $addFields: {
          otherUser: {
            $cond: [{ $eq: ['$fromUserId', me] }, '$toUserId', '$fromUserId'],
          },
        },
      },
      {
        $group: {
          _id: '$otherUser',
          lastMessage: { $first: '$$ROOT' },
        },
      },
      { $sort: { 'lastMessage.createdAt': -1 } },
      { $limit: 50 },
    ]);

    return rows.map((r: { _id: Types.ObjectId; lastMessage: DirectMessageDocument }) => ({
      otherUserId: r._id.toString(),
      lastMessage: this.toPublicLean(r.lastMessage),
    }));
  }

  /**
   * Marque comme lu un message DM reçu.
   */
  async markAsRead(messageId: string, currentUserId: string) {
    const message = await this.model.findById(messageId).exec();
    if (!message) return;
    if (message.toUserId.toString() !== currentUserId) {
      throw new ForbiddenException("Vous ne pouvez marquer comme lus que vos propres messages reçus.");
    }
    if (!message.isRead) {
      message.isRead = true;
      await message.save();
    }
  }

  private toPublic(message: DirectMessageDocument) {
    return {
      id: message._id.toString(),
      fromUserId: message.fromUserId.toString(),
      toUserId: message.toUserId.toString(),
      content: message.content,
      isRead: message.isRead,
      createdAt: (message as unknown as { createdAt: Date }).createdAt,
    };
  }

  /**
   * Variante pour les documents issus de `.lean()` ou d'une agrégation :
   * ces objets sont des POJO (pas des documents Mongoose), d'où un type souple.
   */
  private toPublicLean(d: {
    _id: Types.ObjectId;
    fromUserId: Types.ObjectId;
    toUserId: Types.ObjectId;
    content: string;
    isRead: boolean;
    createdAt?: Date;
  }) {
    return {
      id: d._id.toString(),
      fromUserId: d.fromUserId.toString(),
      toUserId: d.toUserId.toString(),
      content: d.content,
      isRead: d.isRead,
      createdAt: d.createdAt as Date,
    };
  }
}
