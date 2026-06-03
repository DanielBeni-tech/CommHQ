import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type WorkspaceDocument = HydratedDocument<Workspace>;

/**
 * Un Workspace est l'unité organisationnelle de premier niveau,
 * équivalente à un « serveur » Discord ou un « workspace » Slack.
 * Il contient des canaux et regroupe des membres.
 */
@Schema({ timestamps: true })
export class Workspace {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ default: '' })
  description!: string;

  /**
   * Le créateur du workspace. Il devient automatiquement modérateur
   * via la création d'un WorkspaceMember associé.
   */
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, index: true })
  ownerId!: Types.ObjectId;
}

export const WorkspaceSchema = SchemaFactory.createForClass(Workspace);
