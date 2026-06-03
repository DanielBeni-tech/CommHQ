import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type ChannelDocument = HydratedDocument<Channel>;

/**
 * Un canal appartient à un workspace et regroupe une conversation thématique.
 * Type 'text' uniquement pour le MVP ; on pourra ajouter 'voice' plus tard.
 */
@Schema({ timestamps: true })
export class Channel {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Workspace', required: true, index: true })
  workspaceId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ default: '' })
  description!: string;

  @Prop({ type: String, enum: ['text'], default: 'text' })
  type!: 'text';

  @Prop({ default: false })
  isPrivate!: boolean;

  @Prop({ default: 0 })
  order!: number;
}

export const ChannelSchema = SchemaFactory.createForClass(Channel);
ChannelSchema.index({ workspaceId: 1, name: 1 }, { unique: true });
