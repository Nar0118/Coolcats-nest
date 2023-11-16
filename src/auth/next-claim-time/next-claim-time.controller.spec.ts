import { Test, TestingModule } from '@nestjs/testing';
import { NextClaimTimeController } from './next-claim-time.controller';
import { NextClaimTimeService } from './next-claim-time.service';

describe('NextClaimTimeController', () => {
  let controller: NextClaimTimeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NextClaimTimeController],
      providers: [NextClaimTimeService],
    }).compile();

    controller = module.get<NextClaimTimeController>(NextClaimTimeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
