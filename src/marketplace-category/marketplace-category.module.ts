import { Module } from '@nestjs/common';
import { MarketplaceCategoryService } from './marketplace-category.service';
import { MarketplaceCategoryController } from './marketplace-category.controller';

@Module({
  controllers: [MarketplaceCategoryController],
  providers: [MarketplaceCategoryService],
})
export class MarketplaceCategoryModule {}
