import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@Controller()
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  /**
   * Génère un lien d'invitation pour un workspace (modérateur uniquement).
   */
  @Post('workspaces/:workspaceId/invitations')
  create(
    @CurrentUser() current: AuthenticatedUser,
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateInvitationDto,
  ) {
    return this.invitationsService.create(workspaceId, current.userId, dto.email);
  }

  /**
   * Aperçu d'une invitation depuis le lien public.
   * Permet au frontend d'afficher "Vous êtes invité à rejoindre {workspace}".
   */
  @Public()
  @Get('invitations/:token')
  preview(@Param('token') token: string) {
    return this.invitationsService.previewByToken(token);
  }
}
