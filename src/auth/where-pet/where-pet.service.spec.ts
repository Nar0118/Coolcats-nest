import { Test, TestingModule } from '@nestjs/testing';
import { WherePetService } from './where-pet.service';

describe('WherePetService', () => {
  let service: WherePetService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WherePetService],
    }).compile();

    service = module.get<WherePetService>(WherePetService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
