import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Channel, ChannelSchema } from './schemas/channel.schema';
import { Message, MessageSchema } from '../messages/schemas/message.schema';
import { ChannelsService } from './channels.service';
import { ChannelsController } from './channels.controller';
import { WorkspacesModule } from '../workspaces/workspaces.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Channel.name, schema: ChannelSchema },
      // ChannelsService a besoin de purger les messages d'un canal supprimé.
      { name: Message.name, schema: MessageSchema },
    ]),
    forwardRef(() => WorkspacesModule),
  ],
  providers: [ChannelsService],
  controllers: [ChannelsController],
  exports: [ChannelsService, MongooseModule],
})
export class ChannelsModule {}
