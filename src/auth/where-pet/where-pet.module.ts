import { Module } from '@nestjs/common';
import { WherePetService } from './where-pet.service';
import { WherePetController } from './where-pet.controller';
import { DatabaseModule } from '../../database.module';
import { PetManagerModule } from '../../pet-manager.module';

@Module({
  imports: [DatabaseModule, PetManagerModule],
  controllers: [WherePetController],
  providers: [WherePetService],
})
export class WherePetModule {}
