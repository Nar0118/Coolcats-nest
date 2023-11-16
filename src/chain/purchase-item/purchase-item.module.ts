import { Module } from '@nestjs/common';
import { PurchaseItemService } from './purchase-item.service';
import { PurchaseItemController } from './purchase-item.controller';

@Module({
  controllers: [PurchaseItemController],
  providers: [PurchaseItemService],
})
export class PurchaseItemModule {}
