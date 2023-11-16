import { Test, TestingModule } from '@nestjs/testing';
import { CompleteQuestController } from './complete-quest.controller';
import { CompleteQuestService } from './complete-quest.service';

describe('CompleteQuestController', () => {
  let controller: CompleteQuestController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompleteQuestController],
      providers: [CompleteQuestService],
    }).compile();

    controller = module.get<CompleteQuestController>(CompleteQuestController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
