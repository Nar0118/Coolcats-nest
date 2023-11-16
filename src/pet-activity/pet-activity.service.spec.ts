import { Test, TestingModule } from '@nestjs/testing';
import { PetActivityService } from './pet-activity.service';

describe('PetActivityService', () => {
  let service: PetActivityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PetActivityService],
    }).compile();

    service = module.get<PetActivityService>(PetActivityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
