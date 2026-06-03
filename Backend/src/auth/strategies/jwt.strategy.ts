import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

/**
 * Payload signé dans nos JWT.
 * Le client envoie ce token via le header `Authorization: Bearer <token>`.
 */
export interface JwtPayload {
  sub: string; // userId
  email: string;
  role: 'user' | 'admin';
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret') ?? 'changeme',
    });
  }

  /**
   * Passport appelle `validate` après vérification de la signature et de l'expiration.
   * On vérifie ici que l'utilisateur existe toujours et est actif.
   * La valeur retournée est attachée à `request.user`.
   */
  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.usersService.findById(payload.sub).catch(() => null);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Session invalide ou compte désactivé.');
    }
    return {
      userId: user._id.toString(),
      email: user.email,
      globalRole: user.globalRole,
    };
  }
}
