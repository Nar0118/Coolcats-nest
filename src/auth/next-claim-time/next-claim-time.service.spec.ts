import { Test, TestingModule } from '@nestjs/testing';
import { NextClaimTimeService } from './next-claim-time.service';

describe('NextClaimTimeService', () => {
  let service: NextClaimTimeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NextClaimTimeService],
    }).compile();

    service = module.get<NextClaimTimeService>(NextClaimTimeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
