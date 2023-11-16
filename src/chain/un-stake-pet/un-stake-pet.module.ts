import { Module } from '@nestjs/common';
import { UnStakePetService } from './un-stake-pet.service';
import { UnStakePetController } from './un-stake-pet.controller';

@Module({
  controllers: [UnStakePetController],
  providers: [UnStakePetService],
})
export class UnStakePetModule {}
