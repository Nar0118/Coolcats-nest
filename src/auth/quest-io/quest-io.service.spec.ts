import { Test, TestingModule } from '@nestjs/testing';
import { QuestIoService } from './quest-io.service';

describe('QuestIoService', () => {
  let service: QuestIoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QuestIoService],
    }).compile();

    service = module.get<QuestIoService>(QuestIoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
