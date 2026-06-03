import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';
import { InvitationsModule } from '../invitations/invitations.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';

/**
 * Module d'authentification.
 *
 * Note sur `forwardRef` : AuthModule a besoin de WorkspacesModule (pour ajouter
 * un membre à l'espace lors de l'acceptation d'une invitation) et inversement
 * (WorkspacesModule peut avoir besoin du JwtService pour les WebSockets).
 * `forwardRef` casse la dépendance circulaire au moment de l'instanciation.
 */
@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwt.secret'),
        signOptions: { expiresIn: config.get<string>('jwt.expiresIn') },
      }),
    }),
    UsersModule,
    forwardRef(() => InvitationsModule),
    forwardRef(() => WorkspacesModule),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService, JwtModule, JwtStrategy],
})
export class AuthModule {}
