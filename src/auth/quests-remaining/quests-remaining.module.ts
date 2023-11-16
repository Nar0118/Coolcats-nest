import { Module } from '@nestjs/common';
import { QuestsRemainingService } from './quests-remaining.service';
import { QuestsRemainingController } from './quests-remaining.controller';

@Module({
  controllers: [QuestsRemainingController],
  providers: [QuestsRemainingService],
})
export class QuestsRemainingModule {}
