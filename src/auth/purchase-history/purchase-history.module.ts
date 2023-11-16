import { Module } from '@nestjs/common';
import { PurchaseHistoryService } from './purchase-history.service';
import { PurchaseHistoryController } from './purchase-history.controller';

@Module({
  controllers: [PurchaseHistoryController],
  providers: [PurchaseHistoryService],
})
export class PurchaseHistoryModule {}
