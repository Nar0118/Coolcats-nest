import { Module } from '@nestjs/common';
import { SyncItemsService } from './sync-items.service';
import { SyncItemsController } from './sync-items.controller';

@Module({
  controllers: [SyncItemsController],
  providers: [SyncItemsService],
})
export class SyncItemsModule {}
