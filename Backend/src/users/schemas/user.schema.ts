import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

/**
 * Rôle GLOBAL d'un utilisateur sur la plateforme.
 *  - 'user'  : utilisateur classique (peut créer son propre espace de travail).
 *  - 'admin' : administrateur du site (accès au dashboard global).
 *
 * Le rôle dans un espace donné (membre / modérateur) est stocké séparément
 * dans la collection WorkspaceMember.
 */
export type GlobalRole = 'user' | 'admin';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true, index: true })
  email!: string;

  /**
   * Hash bcrypt du mot de passe.
   * `select: false` empêche Mongoose de le retourner dans les requêtes par défaut :
   * il faut explicitement faire `.select('+passwordHash')` quand on en a besoin.
   */
  @Prop({ required: true, select: false })
  passwordHash!: string;

  @Prop({ default: '' })
  avatarUrl!: string;

  @Prop({ type: String, enum: ['user', 'admin'], default: 'user' })
  globalRole!: GlobalRole;

  @Prop({ default: true })
  isActive!: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
