import { Test, TestingModule } from '@nestjs/testing';
import { SyncQuestsService } from './sync-quests.service';

describe('SyncQuestsService', () => {
  let service: SyncQuestsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SyncQuestsService],
    }).compile();

    service = module.get<SyncQuestsService>(SyncQuestsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
