import { Module } from '@nestjs/common';
import { DelistItemService } from './delist-item.service';
import { DelistItemController } from './delist-item.controller';

@Module({
  controllers: [DelistItemController],
  providers: [DelistItemService],
})
export class DelistItemModule {}
