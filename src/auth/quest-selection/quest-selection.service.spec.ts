import { Test, TestingModule } from '@nestjs/testing';
import { QuestSelectionService } from './quest-selection.service';

describe('QuestSelectionService', () => {
  let service: QuestSelectionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QuestSelectionService],
    }).compile();

    service = module.get<QuestSelectionService>(QuestSelectionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
