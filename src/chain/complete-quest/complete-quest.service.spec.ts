import { Test, TestingModule } from '@nestjs/testing';
import { CompleteQuestService } from './complete-quest.service';

describe('CompleteQuestService', () => {
  let service: CompleteQuestService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CompleteQuestService],
    }).compile();

    service = module.get<CompleteQuestService>(CompleteQuestService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
