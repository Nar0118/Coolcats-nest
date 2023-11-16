import { Module } from '@nestjs/common';
import { QuestHistoryService } from './quest-history.service';
import { QuestHistoryController } from './quest-history.controller';

@Module({
  controllers: [QuestHistoryController],
  providers: [QuestHistoryService],
})
export class QuestHistoryModule {}
