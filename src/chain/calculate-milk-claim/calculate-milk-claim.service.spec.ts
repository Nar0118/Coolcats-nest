import { Test, TestingModule } from '@nestjs/testing';
import { CalculateMilkClaimService } from './calculate-milk-claim.service';

describe('CalculateMilkClaimService', () => {
  let service: CalculateMilkClaimService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CalculateMilkClaimService],
    }).compile();

    service = module.get<CalculateMilkClaimService>(CalculateMilkClaimService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
