import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type MessageDocument = HydratedDocument<Message>;

/**
 * Un message dans un canal.
 *
 * Champ `content` :
 *   Contenu Markdown BRUT, sanitisé (suppression des balises HTML dangereuses)
 *   avant stockage. Le rendu HTML est réalisé côté client (react-markdown +
 *   rehype-sanitize + Shiki pour la coloration syntaxique).
 *
 * Performances :
 *   Index composé (channelId, createdAt desc) → pagination rapide de l'historique.
 */
@Schema({ timestamps: true })
export class Message {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Channel', required: true, index: true })
  channelId!: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, index: true })
  authorId!: Types.ObjectId;

  @Prop({ required: true })
  content!: string;

  @Prop({ default: false, index: true })
  pinned!: boolean;

  @Prop({ type: Date, default: null })
  editedAt!: Date | null;

  @Prop({ default: false })
  isDeleted!: boolean;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

// Index principal pour la pagination de l'historique d'un canal.
MessageSchema.index({ channelId: 1, createdAt: -1 });
