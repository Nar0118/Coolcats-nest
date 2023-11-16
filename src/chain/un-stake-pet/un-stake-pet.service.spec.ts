import { Test, TestingModule } from '@nestjs/testing';
import { UnStakePetService } from './un-stake-pet.service';

describe('UnStakePetService', () => {
  let service: UnStakePetService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UnStakePetService],
    }).compile();

    service = module.get<UnStakePetService>(UnStakePetService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
