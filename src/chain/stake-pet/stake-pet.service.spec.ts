import { Test, TestingModule } from '@nestjs/testing';
import { StakePetService } from './stake-pet.service';

describe('StakePetService', () => {
  let service: StakePetService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StakePetService],
    }).compile();

    service = module.get<StakePetService>(StakePetService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
