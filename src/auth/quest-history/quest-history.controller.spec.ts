import { Test, TestingModule } from '@nestjs/testing';
import { QuestHistoryController } from './quest-history.controller';
import { QuestHistoryService } from './quest-history.service';

describe('QuestHistoryController', () => {
  let controller: QuestHistoryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuestHistoryController],
      providers: [QuestHistoryService],
    }).compile();

    controller = module.get<QuestHistoryController>(QuestHistoryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
