import { Test, TestingModule } from '@nestjs/testing';
import { QuestSelectionController } from './quest-selection.controller';
import { QuestSelectionService } from './quest-selection.service';

describe('QuestSelectionController', () => {
  let controller: QuestSelectionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuestSelectionController],
      providers: [QuestSelectionService],
    }).compile();

    controller = module.get<QuestSelectionController>(QuestSelectionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
