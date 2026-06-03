import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { UsersService } from './users.service';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Récupère le profil de l'utilisateur authentifié.
   */
  @Get('me')
  async getMe(@CurrentUser() current: AuthenticatedUser) {
    const user = await this.usersService.findById(current.userId);
    return this.usersService.toPublic(user);
  }

  /**
   * Met à jour le profil (nom, avatar) de l'utilisateur authentifié.
   */
  @Patch('me')
  async updateMe(
    @CurrentUser() current: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ) {
    const updated = await this.usersService.updateProfile(current.userId, dto);
    return this.usersService.toPublic(updated);
  }

  /**
   * Récupère le profil public d'un autre utilisateur.
   */
  @Get(':id')
  async getById(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    return this.usersService.toPublic(user);
  }
}
