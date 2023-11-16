import { Test, TestingModule } from '@nestjs/testing';
import { QuestsRemainingService } from './quests-remaining.service';

describe('QuestsRemainingService', () => {
  let service: QuestsRemainingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QuestsRemainingService],
    }).compile();

    service = module.get<QuestsRemainingService>(QuestsRemainingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
