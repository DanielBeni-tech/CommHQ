import { Module } from '@nestjs/common';

import { AuthModule } from '../../auth/auth.module';
import { UsersModule } from '../../users/users.module';
import { WorkspacesModule } from '../../workspaces/workspaces.module';
import { ChannelsModule } from '../../channels/channels.module';
import { MessagesModule } from '../../messages/messages.module';
import { DemoSeedService } from './demo-seed.service';

/**
 * Module isolé qui héberge le seed de démo. Tout le câblage est fait ici
 * pour éviter d'alourdir AppModule avec des imports liés à la démo.
 */
@Module({
  imports: [AuthModule, UsersModule, WorkspacesModule, ChannelsModule, MessagesModule],
  providers: [DemoSeedService],
})
export class DemoSeedModule {}
