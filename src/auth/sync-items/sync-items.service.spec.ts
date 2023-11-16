import { Test, TestingModule } from '@nestjs/testing';
import { SyncItemsService } from './sync-items.service';

describe('SyncItemsService', () => {
  let service: SyncItemsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SyncItemsService],
    }).compile();

    service = module.get<SyncItemsService>(SyncItemsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
