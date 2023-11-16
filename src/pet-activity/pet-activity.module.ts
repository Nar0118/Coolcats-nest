import { Module } from '@nestjs/common';
import { PetActivityService } from './pet-activity.service';
import { PetActivityController } from './pet-activity.controller';

@Module({
  controllers: [PetActivityController],
  providers: [PetActivityService],
})
export class PetActivityModule {}
