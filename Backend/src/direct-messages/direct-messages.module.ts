import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DirectMessage, DirectMessageSchema } from './schemas/direct-message.schema';
import { DirectMessagesService } from './direct-messages.service';
import { DirectMessagesController } from './direct-messages.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DirectMessage.name, schema: DirectMessageSchema },
    ]),
    UsersModule,
  ],
  providers: [DirectMessagesService],
  controllers: [DirectMessagesController],
  exports: [DirectMessagesService],
})
export class DirectMessagesModule {}
