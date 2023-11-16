import { Module } from '@nestjs/common';
import { QuestIoService } from './quest-io.service';
import { QuestIoController } from './quest-io.controller';

@Module({
  controllers: [QuestIoController],
  providers: [QuestIoService],
})
export class QuestIoModule {}
