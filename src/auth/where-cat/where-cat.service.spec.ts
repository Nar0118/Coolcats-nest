import { Test, TestingModule } from '@nestjs/testing';
import { WhereCatService } from './where-cat.service';

describe('WhereCatService', () => {
  let service: WhereCatService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WhereCatService],
    }).compile();

    service = module.get<WhereCatService>(WhereCatService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
