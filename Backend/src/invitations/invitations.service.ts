import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';

import { Invitation, InvitationDocument } from './schemas/invitation.schema';
import { WorkspacesService } from '../workspaces/workspaces.service';

@Injectable()
export class InvitationsService {
  constructor(
    @InjectModel(Invitation.name)
    private readonly model: Model<InvitationDocument>,
    @Inject(forwardRef(() => WorkspacesService))
    private readonly workspacesService: WorkspacesService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Génère une invitation (modérateur uniquement).
   * Retourne l'URL complète à partager avec le futur utilisateur.
   */
  async create(workspaceId: string, requesterId: string, email?: string) {
    await this.workspacesService.ensureModerator(workspaceId, requesterId);

    const ttlHours = this.configService.get<number>('invitations.ttlHours') ?? 72;
    const frontendUrl =
      this.configService.get<string>('invitations.frontendUrl') ?? 'http://localhost:5173';

    const token = this.generateSecureToken();
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);

    const invitation = await this.model.create({
      workspaceId: new Types.ObjectId(workspaceId),
      createdByUserId: new Types.ObjectId(requesterId),
      email: email ? email.toLowerCase().trim() : null,
      token,
      expiresAt,
    });

    return {
      id: invitation._id.toString(),
      token,
      expiresAt,
      // Le frontend interceptera cette URL et redirigera vers /onboarding?token=…
      url: `${frontendUrl}/invite/${token}`,
      email: invitation.email,
    };
  }

  /**
   * Vérifie qu'un token correspond à une invitation valide.
   * Lève sinon. Utilisée par AuthService au moment du register.
   */
  async findValidByToken(token: string): Promise<InvitationDocument> {
    if (!token || typeof token !== 'string') {
      throw new BadRequestException('Token invalide.');
    }
    const invitation = await this.model.findOne({ token }).exec();
    if (!invitation) {
      throw new NotFoundException('Invitation introuvable.');
    }
    if (invitation.usedByUserId) {
      throw new BadRequestException('Cette invitation a déjà été utilisée.');
    }
    if (invitation.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Cette invitation a expiré.');
    }
    return invitation;
  }

  /**
   * Aperçu public d'une invitation (avant inscription). Ne révèle pas le créateur.
   * Inclut le nom du workspace pour que le frontend puisse afficher
   * "Vous êtes invité à rejoindre {workspaceName}" sans appel additionnel.
   */
  async previewByToken(token: string) {
    const invitation = await this.findValidByToken(token);
    const workspace = await this.workspacesService
      .findById(invitation.workspaceId.toString())
      .catch(() => null);
    return {
      token: invitation.token,
      workspaceId: invitation.workspaceId.toString(),
      workspaceName: workspace?.name ?? 'un espace de travail',
      email: invitation.email,
      expiresAt: invitation.expiresAt,
    };
  }

  /**
   * Marque l'invitation comme consommée. Idempotent.
   */
  async consume(invitationId: string, byUserId: string) {
    await this.model
      .findByIdAndUpdate(invitationId, {
        usedByUserId: new Types.ObjectId(byUserId),
      })
      .exec();
  }

  /**
   * Token cryptographiquement aléatoire (32 octets → 64 caractères hexa).
   * `randomBytes` est sécurisé pour ce cas d'usage.
   */
  private generateSecureToken(): string {
    return randomBytes(32).toString('hex');
  }
}
