import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { sanitizePlainText } from '../common/utils/sanitize.util';

/**
 * Service centralisant les opérations sur la collection User.
 * Tous les autres modules qui ont besoin d'un utilisateur passent par ici.
 */
@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async findById(userId: string): Promise<UserDocument> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new NotFoundException("Identifiant d'utilisateur invalide.");
    }
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('Utilisateur introuvable.');
    }
    return user;
  }

  /**
   * Récupère un utilisateur par email, AVEC son hash de mot de passe.
   * Utilisé uniquement pour la connexion (vérification du mot de passe).
   */
  async findByEmailWithPassword(email: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ email: email.toLowerCase().trim() })
      .select('+passwordHash')
      .exec();
  }

  async existsByEmail(email: string): Promise<boolean> {
    const found = await this.userModel
      .exists({ email: email.toLowerCase().trim() })
      .exec();
    return found !== null;
  }

  /**
   * Crée un utilisateur. Le mot de passe doit déjà être haché (responsabilité d'AuthService).
   */
  async create(input: {
    name: string;
    email: string;
    passwordHash: string;
    avatarUrl?: string;
  }): Promise<UserDocument> {
    const created = await this.userModel.create({
      name: sanitizePlainText(input.name),
      email: input.email.toLowerCase().trim(),
      passwordHash: input.passwordHash,
      avatarUrl: input.avatarUrl ? sanitizePlainText(input.avatarUrl) : '',
    });
    return created;
  }

  async updateProfile(
    userId: string,
    update: { name?: string; avatarUrl?: string },
  ): Promise<UserDocument> {
    const patch: Partial<User> = {};
    if (update.name !== undefined) patch.name = sanitizePlainText(update.name);
    if (update.avatarUrl !== undefined) patch.avatarUrl = sanitizePlainText(update.avatarUrl);

    const updated = await this.userModel
      .findByIdAndUpdate(userId, patch, { new: true })
      .exec();
    if (!updated) {
      throw new NotFoundException('Utilisateur introuvable.');
    }
    return updated;
  }

  /**
   * Représentation publique d'un utilisateur (sans hash de mot de passe).
   */
  toPublic(user: UserDocument): {
    id: string;
    name: string;
    email: string;
    avatarUrl: string;
    globalRole: string;
  } {
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      globalRole: user.globalRole,
    };
  }
}
