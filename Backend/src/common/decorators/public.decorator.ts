import { SetMetadata } from '@nestjs/common';

/**
 * Marque une route comme publique (non protégée par JWT).
 * Utilisé par exemple pour /auth/login, /auth/register, /invitations/:token.
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = (): MethodDecorator & ClassDecorator =>
  SetMetadata(IS_PUBLIC_KEY, true);
