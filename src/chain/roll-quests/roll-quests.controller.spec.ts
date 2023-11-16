import { Test, TestingModule } from '@nestjs/testing';
import { RollQuestsController } from './roll-quests.controller';
import { RollQuestsService } from './roll-quests.service';

describe('RollQuestsController', () => {
  let controller: RollQuestsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RollQuestsController],
      providers: [RollQuestsService],
    }).compile();

    controller = module.get<RollQuestsController>(RollQuestsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
