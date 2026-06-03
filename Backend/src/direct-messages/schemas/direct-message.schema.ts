import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type DirectMessageDocument = HydratedDocument<DirectMessage>;

/**
 * Conversation 1-à-1 entre utilisateurs.
 *
 * Modèle simple : un seul document par message, avec auteur + destinataire.
 * L'index composé (participants, createdAt) permet la pagination rapide
 * de l'historique d'une conversation.
 */
@Schema({ timestamps: true })
export class DirectMessage {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, index: true })
  fromUserId!: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, index: true })
  toUserId!: Types.ObjectId;

  @Prop({ required: true })
  content!: string;

  @Prop({ default: false })
  isRead!: boolean;
}

export const DirectMessageSchema = SchemaFactory.createForClass(DirectMessage);
DirectMessageSchema.index({ fromUserId: 1, toUserId: 1, createdAt: -1 });
