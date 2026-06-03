import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type SummaryDocument = HydratedDocument<Summary>;

/**
 * Résumé IA d'une discussion de canal.
 *
 * Stocké pour historiser les résumés (collection légère) et éviter de regénérer
 * un résumé identique. Les trois phrases sont stockées séparément pour faciliter
 * l'affichage et garantir le format imposé par le cahier des charges.
 */
@Schema({ timestamps: true })
export class Summary {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Channel', required: true, index: true })
  channelId!: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  requestedByUserId!: Types.ObjectId;

  /**
   * Tableau de 3 phrases (exactement) résumant les décisions et actions clés.
   */
  @Prop({ type: [String], required: true })
  sentences!: string[];

  @Prop({ default: 0 })
  messageCount!: number;

  @Prop({ default: '' })
  modelUsed!: string;
}

export const SummarySchema = SchemaFactory.createForClass(Summary);
