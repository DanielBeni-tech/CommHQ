import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

import { UsersService } from '../users/users.service';
import { UserDocument } from '../users/schemas/user.schema';
import { InvitationsService } from '../invitations/invitations.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './strategies/jwt.strategy';

/**
 * Coût bcrypt : 10 = bon équilibre rapidité / sécurité pour un hackathon.
 * En production sur une machine moderne, 12 est recommandé.
 */
const BCRYPT_SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly invitationsService: InvitationsService,
    private readonly workspacesService: WorkspacesService,
  ) {}

  /**
   * Création de compte.
   *
   * Si un `invitationToken` est fourni :
   *  1) On valide le token (existant, non utilisé, non expiré).
   *  2) On crée le compte.
   *  3) On marque l'invitation comme consommée et on ajoute l'utilisateur
   *     comme membre de l'espace de travail correspondant.
   *
   * Sinon, un compte « libre » est créé (l'utilisateur pourra ensuite créer
   * son propre espace de travail).
   */
  async register(dto: RegisterDto) {
    const emailNormalized = dto.email.toLowerCase().trim();

    if (await this.usersService.existsByEmail(emailNormalized)) {
      throw new ConflictException('Un compte existe déjà avec cet email.');
    }

    let invitation = null;
    if (dto.invitationToken) {
      // On lit l'invitation AVANT la création de compte pour échouer tôt si elle est invalide.
      invitation = await this.invitationsService.findValidByToken(dto.invitationToken);
      if (invitation.email && invitation.email.toLowerCase() !== emailNormalized) {
        throw new UnauthorizedException(
          "Cette invitation est destinée à une autre adresse email.",
        );
      }
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);
    const user = await this.usersService.create({
      name: dto.name,
      email: emailNormalized,
      passwordHash,
      avatarUrl: dto.avatarUrl,
    });

    if (invitation) {
      await this.invitationsService.consume(invitation._id.toString(), user._id.toString());
      await this.workspacesService.addMember(
        invitation.workspaceId.toString(),
        user._id.toString(),
        'member',
      );
    }

    return this.buildAuthResponse(user);
  }

  /**
   * Connexion classique email + mot de passe.
   * On compare le hash bcrypt — temps constant pour éviter les attaques chronométriques.
   */
  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmailWithPassword(dto.email);
    if (!user || !user.isActive) {
      // Message volontairement vague : ne pas révéler si l'email existe.
      throw new UnauthorizedException('Email ou mot de passe incorrect.');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email ou mot de passe incorrect.');
    }

    return this.buildAuthResponse(user);
  }

  /**
   * Génère l'access token (court) et le refresh token (long).
   * Le refresh token n'est pas stocké côté serveur dans cette version (stateless).
   * Pour de la révocation, prévoir une liste de jetons révoqués (Redis) en production.
   */
  private buildAuthResponse(user: UserDocument) {
    const payload: JwtPayload = {
      sub: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.globalRole,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.secret'),
      expiresIn: this.configService.get<string>('jwt.expiresIn'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.refreshSecret'),
      expiresIn: this.configService.get<string>('jwt.refreshExpiresIn'),
    });

    return {
      accessToken,
      refreshToken,
      user: this.usersService.toPublic(user),
    };
  }
}
