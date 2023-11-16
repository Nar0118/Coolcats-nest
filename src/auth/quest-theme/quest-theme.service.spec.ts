import { Test, TestingModule } from '@nestjs/testing';
import { QuestThemeService } from './quest-theme.service';

describe('QuestThemeService', () => {
  let service: QuestThemeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QuestThemeService],
    }).compile();

    service = module.get<QuestThemeService>(QuestThemeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
