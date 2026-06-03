import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  /**
   * Crée un nouveau workspace ; l'utilisateur courant devient modérateur.
   */
  @Post()
  create(@CurrentUser() current: AuthenticatedUser, @Body() dto: CreateWorkspaceDto) {
    return this.workspacesService.create(current.userId, dto);
  }

  /**
   * Liste les workspaces dont je suis membre.
   */
  @Get()
  list(@CurrentUser() current: AuthenticatedUser) {
    return this.workspacesService.listForUser(current.userId);
  }

  @Get(':id')
  async get(@CurrentUser() current: AuthenticatedUser, @Param('id') id: string) {
    await this.workspacesService.ensureMember(id, current.userId);
    const ws = await this.workspacesService.findById(id);
    return {
      id: ws._id.toString(),
      name: ws.name,
      description: ws.description,
      ownerId: ws.ownerId.toString(),
    };
  }

  @Get(':id/members')
  async members(@CurrentUser() current: AuthenticatedUser, @Param('id') id: string) {
    await this.workspacesService.ensureMember(id, current.userId);
    return this.workspacesService.listMembers(id);
  }
}
