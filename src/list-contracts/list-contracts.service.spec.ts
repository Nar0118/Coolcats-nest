import { Test, TestingModule } from '@nestjs/testing';
import { ListContractsService } from './list-contracts.service';

describe('ListContractsService', () => {
  let service: ListContractsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ListContractsService],
    }).compile();

    service = module.get<ListContractsService>(ListContractsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
