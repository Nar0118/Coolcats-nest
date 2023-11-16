import { Module } from '@nestjs/common';
import { WhereCatService } from './where-cat.service';
import { WhereCatController } from './where-cat.controller';

@Module({
  controllers: [WhereCatController],
  providers: [WhereCatService],
})
export class WhereCatModule {}
