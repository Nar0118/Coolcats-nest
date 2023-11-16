import { Module } from '@nestjs/common';
import { CalculateAdventureClaimService } from './calculate-adventure-claim.service';
import { CalculateAdventureClaimController } from './calculate-adventure-claim.controller';

@Module({
  controllers: [CalculateAdventureClaimController],
  providers: [CalculateAdventureClaimService],
})
export class CalculateAdventureClaimModule {}
