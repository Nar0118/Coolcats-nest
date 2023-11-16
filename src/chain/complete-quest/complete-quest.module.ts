import { Module } from '@nestjs/common';
import { CompleteQuestService } from './complete-quest.service';
import { CompleteQuestController } from './complete-quest.controller';

@Module({
  controllers: [CompleteQuestController],
  providers: [CompleteQuestService],
})
export class CompleteQuestModule {}
