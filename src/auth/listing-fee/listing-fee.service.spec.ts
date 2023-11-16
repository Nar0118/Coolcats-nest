import { Test, TestingModule } from '@nestjs/testing';
import { ListingFeeService } from './listing-fee.service';

describe('ListingFeeService', () => {
  let service: ListingFeeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ListingFeeService],
    }).compile();

    service = module.get<ListingFeeService>(ListingFeeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
