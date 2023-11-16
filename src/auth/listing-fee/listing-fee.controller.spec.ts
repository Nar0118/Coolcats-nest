import { Test, TestingModule } from '@nestjs/testing';
import { ListingFeeController } from './listing-fee.controller';
import { ListingFeeService } from './listing-fee.service';

describe('ListingFeeController', () => {
  let controller: ListingFeeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ListingFeeController],
      providers: [ListingFeeService],
    }).compile();

    controller = module.get<ListingFeeController>(ListingFeeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
