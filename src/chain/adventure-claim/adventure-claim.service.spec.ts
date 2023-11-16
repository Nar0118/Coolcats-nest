import { Test, TestingModule } from '@nestjs/testing';
import { AdventureClaimService } from './adventure-claim.service';

describe('AdventureClaimService', () => {
  let service: AdventureClaimService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdventureClaimService],
    }).compile();

    service = module.get<AdventureClaimService>(AdventureClaimService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
