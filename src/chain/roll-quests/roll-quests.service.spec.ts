import { Test, TestingModule } from '@nestjs/testing';
import { RollQuestsService } from './roll-quests.service';

describe('RollQuestsService', () => {
  let service: RollQuestsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RollQuestsService],
    }).compile();

    service = module.get<RollQuestsService>(RollQuestsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
