import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Représente l'utilisateur authentifié extrait du JWT (payload validé par JwtStrategy).
 */
export interface AuthenticatedUser {
  userId: string;
  email: string;
  globalRole: 'user' | 'admin';
}

/**
 * Décorateur pratique : injecte l'utilisateur courant dans un handler de contrôleur.
 *
 * Usage :
 *   @Get('me')
 *   getMe(@CurrentUser() user: AuthenticatedUser) { ... }
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as AuthenticatedUser;
  },
);
