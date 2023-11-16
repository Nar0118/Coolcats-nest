import { Test, TestingModule } from '@nestjs/testing';
import { SyncQuestsController } from './sync-quests.controller';
import { SyncQuestsService } from './sync-quests.service';

describe('SyncQuestsController', () => {
  let controller: SyncQuestsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SyncQuestsController],
      providers: [SyncQuestsService],
    }).compile();

    controller = module.get<SyncQuestsController>(SyncQuestsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
