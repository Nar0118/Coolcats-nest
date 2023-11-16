import { Test, TestingModule } from '@nestjs/testing';
import { MarketplaceCategoryController } from './marketplace-category.controller';
import { MarketplaceCategoryService } from './marketplace-category.service';

describe('MarketplaceCategoryController', () => {
  let controller: MarketplaceCategoryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MarketplaceCategoryController],
      providers: [MarketplaceCategoryService],
    }).compile();

    controller = module.get<MarketplaceCategoryController>(
      MarketplaceCategoryController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
