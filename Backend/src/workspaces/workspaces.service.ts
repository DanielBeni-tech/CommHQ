import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Workspace, WorkspaceDocument } from './schemas/workspace.schema';
import {
  WorkspaceMember,
  WorkspaceMemberDocument,
  WorkspaceRole,
} from './schemas/workspace-member.schema';
import { sanitizePlainText } from '../common/utils/sanitize.util';
import { ChannelsService } from '../channels/channels.service';

@Injectable()
export class WorkspacesService {
  constructor(
    @InjectModel(Workspace.name)
    private readonly workspaceModel: Model<WorkspaceDocument>,
    @InjectModel(WorkspaceMember.name)
    private readonly memberModel: Model<WorkspaceMemberDocument>,
    // forwardRef pour casser la dépendance circulaire :
    // Workspaces crée un canal de bienvenue, et ChannelsService peut avoir besoin
    // de vérifier l'appartenance à un workspace.
    @Inject(forwardRef(() => ChannelsService))
    private readonly channelsService: ChannelsService,
  ) {}

  /**
   * Crée un workspace.
   *
   * Conséquences automatiques :
   *  - Le créateur devient MODÉRATEUR du workspace (WorkspaceMember).
   *  - Un canal de bienvenue (#general) est créé par défaut.
   */
  async create(creatorId: string, dto: { name: string; description?: string }) {
    if (!Types.ObjectId.isValid(creatorId)) {
      throw new NotFoundException('Utilisateur invalide.');
    }

    const workspace = await this.workspaceModel.create({
      name: sanitizePlainText(dto.name),
      description: dto.description ? sanitizePlainText(dto.description) : '',
      ownerId: new Types.ObjectId(creatorId),
    });

    await this.memberModel.create({
      workspaceId: workspace._id,
      userId: new Types.ObjectId(creatorId),
      role: 'moderator',
    });

    // Canal de bienvenue par défaut (cf. cahier des charges F-WS-3).
    await this.channelsService.create(workspace._id.toString(), creatorId, {
      name: 'general',
      description: 'Canal de bienvenue — discutez librement ici.',
    });

    // Le créateur est par construction modérateur — on le renvoie pour
    // que le frontend puisse activer immédiatement les contrôles d'admin.
    return { ...this.toPublic(workspace), myRole: 'moderator' as WorkspaceRole };
  }

  async findById(workspaceId: string): Promise<WorkspaceDocument> {
    if (!Types.ObjectId.isValid(workspaceId)) {
      throw new NotFoundException('Workspace introuvable.');
    }
    const ws = await this.workspaceModel.findById(workspaceId).exec();
    if (!ws) {
      throw new NotFoundException('Workspace introuvable.');
    }
    return ws;
  }

  /**
   * Liste tous les workspaces dont l'utilisateur est membre.
   */
  async listForUser(userId: string) {
    const memberships = await this.memberModel
      .find({ userId: new Types.ObjectId(userId) })
      .lean()
      .exec();

    const workspaceIds = memberships.map((m) => m.workspaceId);
    const workspaces = await this.workspaceModel
      .find({ _id: { $in: workspaceIds } })
      .exec();

    return workspaces.map((ws) => {
      const membership = memberships.find((m) =>
        m.workspaceId.equals(ws._id as Types.ObjectId),
      );
      return {
        ...this.toPublic(ws),
        myRole: (membership?.role ?? 'member') as WorkspaceRole,
      };
    });
  }

  /**
   * Ajoute un membre au workspace.
   * Si le membre existe déjà, on ne fait rien (idempotent).
   */
  async addMember(workspaceId: string, userId: string, role: WorkspaceRole = 'member') {
    const exists = await this.memberModel
      .exists({
        workspaceId: new Types.ObjectId(workspaceId),
        userId: new Types.ObjectId(userId),
      })
      .exec();
    if (exists) {
      return;
    }
    await this.memberModel.create({
      workspaceId: new Types.ObjectId(workspaceId),
      userId: new Types.ObjectId(userId),
      role,
    });
  }

  /**
   * Récupère le rôle d'un utilisateur dans un workspace.
   * Retourne null s'il n'est pas membre.
   */
  async getMemberRole(workspaceId: string, userId: string): Promise<WorkspaceRole | null> {
    if (!Types.ObjectId.isValid(workspaceId) || !Types.ObjectId.isValid(userId)) {
      return null;
    }
    const member = await this.memberModel
      .findOne({
        workspaceId: new Types.ObjectId(workspaceId),
        userId: new Types.ObjectId(userId),
      })
      .lean()
      .exec();
    return member?.role ?? null;
  }

  /**
   * Vérifie qu'un utilisateur est membre. Lève sinon.
   */
  async ensureMember(workspaceId: string, userId: string): Promise<WorkspaceRole> {
    const role = await this.getMemberRole(workspaceId, userId);
    if (!role) {
      throw new ForbiddenException("Vous n'êtes pas membre de cet espace de travail.");
    }
    return role;
  }

  /**
   * Vérifie qu'un utilisateur est modérateur. Lève sinon.
   */
  async ensureModerator(workspaceId: string, userId: string): Promise<void> {
    const role = await this.ensureMember(workspaceId, userId);
    if (role !== 'moderator') {
      throw new ForbiddenException('Action réservée aux modérateurs.');
    }
  }

  async listMembers(workspaceId: string) {
    return this.memberModel
      .find({ workspaceId: new Types.ObjectId(workspaceId) })
      .populate('userId', 'name email avatarUrl')
      .lean()
      .exec();
  }

  private toPublic(ws: WorkspaceDocument) {
    return {
      id: ws._id.toString(),
      name: ws.name,
      description: ws.description,
      ownerId: ws.ownerId.toString(),
    };
  }
}
