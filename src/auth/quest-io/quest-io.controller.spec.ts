import { Test, TestingModule } from '@nestjs/testing';
import { QuestIoController } from './quest-io.controller';
import { QuestIoService } from './quest-io.service';

describe('QuestIoController', () => {
  let controller: QuestIoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuestIoController],
      providers: [QuestIoService],
    }).compile();

    controller = module.get<QuestIoController>(QuestIoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
