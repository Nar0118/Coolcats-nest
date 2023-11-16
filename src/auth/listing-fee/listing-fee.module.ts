import { Module } from '@nestjs/common';
import { ListingFeeService } from './listing-fee.service';
import { ListingFeeController } from './listing-fee.controller';

@Module({
  controllers: [ListingFeeController],
  providers: [ListingFeeService],
})
export class ListingFeeModule {}
