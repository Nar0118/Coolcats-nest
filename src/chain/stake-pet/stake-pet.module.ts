import { Module } from '@nestjs/common';
import { StakePetService } from './stake-pet.service';
import { StakePetController } from './stake-pet.controller';

@Module({
  controllers: [StakePetController],
  providers: [StakePetService],
})
export class StakePetModule {}
