import { Test, TestingModule } from '@nestjs/testing';
import { DelistItemService } from './delist-item.service';

describe('DelistItemService', () => {
  let service: DelistItemService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DelistItemService],
    }).compile();

    service = module.get<DelistItemService>(DelistItemService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
