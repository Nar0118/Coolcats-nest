import { Test, TestingModule } from '@nestjs/testing';
import { QuestsRemainingController } from './quests-remaining.controller';
import { QuestsRemainingService } from './quests-remaining.service';

describe('QuestsRemainingController', () => {
  let controller: QuestsRemainingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuestsRemainingController],
      providers: [QuestsRemainingService],
    }).compile();

    controller = module.get<QuestsRemainingController>(
      QuestsRemainingController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
