import { Module } from '@nestjs/common';
import { AdventureClaimService } from './adventure-claim.service';
import { AdventureClaimController } from './adventure-claim.controller';

@Module({
  controllers: [AdventureClaimController],
  providers: [AdventureClaimService],
})
export class AdventureClaimModule {}
