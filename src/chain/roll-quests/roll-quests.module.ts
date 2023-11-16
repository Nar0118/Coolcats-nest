import { Module } from '@nestjs/common';
import { RollQuestsService } from './roll-quests.service';
import { RollQuestsController } from './roll-quests.controller';

@Module({
  controllers: [RollQuestsController],
  providers: [RollQuestsService],
})
export class RollQuestsModule {}
