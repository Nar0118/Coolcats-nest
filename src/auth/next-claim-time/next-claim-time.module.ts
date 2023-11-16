import { Module } from '@nestjs/common';
import { NextClaimTimeService } from './next-claim-time.service';
import { NextClaimTimeController } from './next-claim-time.controller';

@Module({
  controllers: [NextClaimTimeController],
  providers: [NextClaimTimeService],
})
export class NextClaimTimeModule {}
