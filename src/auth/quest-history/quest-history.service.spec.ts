import { Test, TestingModule } from '@nestjs/testing';
import { QuestHistoryService } from './quest-history.service';

describe('QuestHistoryService', () => {
  let service: QuestHistoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QuestHistoryService],
    }).compile();

    service = module.get<QuestHistoryService>(QuestHistoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
