import { Test, TestingModule } from '@nestjs/testing';
import { MarketplaceCategoryService } from './marketplace-category.service';

describe('MarketplaceCategoryService', () => {
  let service: MarketplaceCategoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MarketplaceCategoryService],
    }).compile();

    service = module.get<MarketplaceCategoryService>(
      MarketplaceCategoryService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
