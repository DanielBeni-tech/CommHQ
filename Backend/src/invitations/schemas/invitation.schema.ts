import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type InvitationDocument = HydratedDocument<Invitation>;

/**
 * Invitation à rejoindre un workspace.
 *
 * - `token` : chaîne aléatoire utilisée comme identifiant public partagé dans le lien.
 * - `email` (optionnel) : restreint l'invitation à une adresse email donnée.
 * - `expiresAt` : MongoDB peut auto-supprimer le document via un index TTL.
 * - `usedByUserId` : utilisateur qui a consommé l'invitation (null tant que non utilisée).
 */
@Schema({ timestamps: true })
export class Invitation {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Workspace', required: true, index: true })
  workspaceId!: Types.ObjectId;

  @Prop({ required: true, unique: true, index: true })
  token!: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  createdByUserId!: Types.ObjectId;

  @Prop({ default: null, lowercase: true, trim: true })
  email!: string | null;

  @Prop({ required: true })
  expiresAt!: Date;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', default: null })
  usedByUserId!: Types.ObjectId | null;
}

export const InvitationSchema = SchemaFactory.createForClass(Invitation);

// Index TTL : Mongo supprimera automatiquement les invitations expirées.
InvitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
