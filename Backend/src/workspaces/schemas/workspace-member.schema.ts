import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

/**
 * Rôle d'un utilisateur AU SEIN d'un workspace donné.
 *  - 'moderator' : peut gérer canaux, membres, épinglages.
 *  - 'member'    : peut lire / écrire dans les canaux dont il est membre.
 */
export type WorkspaceRole = 'member' | 'moderator';

export type WorkspaceMemberDocument = HydratedDocument<WorkspaceMember>;

@Schema({ timestamps: true })
export class WorkspaceMember {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Workspace', required: true, index: true })
  workspaceId!: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: String, enum: ['member', 'moderator'], default: 'member' })
  role!: WorkspaceRole;
}

export const WorkspaceMemberSchema = SchemaFactory.createForClass(WorkspaceMember);

// Un même utilisateur ne peut être inscrit qu'une seule fois dans un workspace.
WorkspaceMemberSchema.index({ workspaceId: 1, userId: 1 }, { unique: true });
