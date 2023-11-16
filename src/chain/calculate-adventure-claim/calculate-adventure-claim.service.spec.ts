import { Test, TestingModule } from '@nestjs/testing';
import { CalculateAdventureClaimService } from './calculate-adventure-claim.service';

describe('CalculateAdventureClaimService', () => {
  let service: CalculateAdventureClaimService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CalculateAdventureClaimService],
    }).compile();

    service = module.get<CalculateAdventureClaimService>(
      CalculateAdventureClaimService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
