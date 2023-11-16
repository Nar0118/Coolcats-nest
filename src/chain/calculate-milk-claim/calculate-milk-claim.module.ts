import { Module } from '@nestjs/common';
import { CalculateMilkClaimService } from './calculate-milk-claim.service';
import { CalculateMilkClaimController } from './calculate-milk-claim.controller';

@Module({
  controllers: [CalculateMilkClaimController],
  providers: [CalculateMilkClaimService],
})
export class CalculateMilkClaimModule {}
