import { Module } from '@nestjs/common';
import { QuestSelectionService } from './quest-selection.service';
import { QuestSelectionController } from './quest-selection.controller';

@Module({
  controllers: [QuestSelectionController],
  providers: [QuestSelectionService],
})
export class QuestSelectionModule {}
