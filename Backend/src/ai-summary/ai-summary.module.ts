import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Summary, SummarySchema } from './schemas/summary.schema';
import { AiSummaryService } from './ai-summary.service';
import { AiSummaryController } from './ai-summary.controller';
import { MessagesModule } from '../messages/messages.module';
import { ChannelsModule } from '../channels/channels.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Summary.name, schema: SummarySchema }]),
    MessagesModule,
    ChannelsModule,
  ],
  providers: [AiSummaryService],
  controllers: [AiSummaryController],
  exports: [AiSummaryService],
})
export class AiSummaryModule {}
