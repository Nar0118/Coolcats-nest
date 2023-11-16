import { Module } from '@nestjs/common';
import { ListContractsService } from './list-contracts.service';
import { ListContractsController } from './list-contracts.controller';

@Module({
  controllers: [ListContractsController],
  providers: [ListContractsService],
})
export class ListContractsModule {}
