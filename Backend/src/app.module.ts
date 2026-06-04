import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { APP_GUARD } from '@nestjs/core';

import configuration from './config/configuration';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { ChannelsModule } from './channels/channels.module';
import { MessagesModule } from './messages/messages.module';
import { DirectMessagesModule } from './direct-messages/direct-messages.module';
import { InvitationsModule } from './invitations/invitations.module';
import { AiSummaryModule } from './ai-summary/ai-summary.module';
import { DemoSeedModule } from './common/seeds/demo-seed.module';
import { HealthController } from './health.controller';

/**
 * Module racine de l'application.
 *
 * - ConfigModule charge .env (variables d'environnement) et expose ConfigService.
 * - MongooseModule établit la connexion à MongoDB.
 * - JwtAuthGuard est déclaré APP_GUARD => toutes les routes sont protégées par défaut,
 *   sauf celles annotées @Public() (auth, invitations, health…).
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // ConfigService disponible partout sans import explicite
      load: [configuration],
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('mongodbUri'),
        // Options de connexion optimisées pour le temps réel : pool plus large
        // afin d'absorber les pics de requêtes WebSocket.
        maxPoolSize: 20,
        serverSelectionTimeoutMS: 5_000,
      }),
    }),

    AuthModule,
    UsersModule,
    WorkspacesModule,
    ChannelsModule,
    MessagesModule,
    DirectMessagesModule,
    InvitationsModule,
    AiSummaryModule,
    DemoSeedModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
