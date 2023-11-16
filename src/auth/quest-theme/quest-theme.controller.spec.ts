import { Test, TestingModule } from '@nestjs/testing';
import { QuestThemeController } from './quest-theme.controller';
import { QuestThemeService } from './quest-theme.service';

describe('QuestThemeController', () => {
  let controller: QuestThemeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuestThemeController],
      providers: [QuestThemeService],
    }).compile();

    controller = module.get<QuestThemeController>(QuestThemeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
