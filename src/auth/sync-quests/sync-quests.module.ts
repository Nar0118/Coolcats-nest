import { Module } from '@nestjs/common';
import { SyncQuestsService } from './sync-quests.service';
import { SyncQuestsController } from './sync-quests.controller';

@Module({
  controllers: [SyncQuestsController],
  providers: [SyncQuestsService],
})
export class SyncQuestsModule {}
