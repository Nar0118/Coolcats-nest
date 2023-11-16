import { Test, TestingModule } from '@nestjs/testing';
import { CalculateAdventureClaimController } from './calculate-adventure-claim.controller';
import { CalculateAdventureClaimService } from './calculate-adventure-claim.service';

describe('CalculateAdventureClaimController', () => {
  let controller: CalculateAdventureClaimController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CalculateAdventureClaimController],
      providers: [CalculateAdventureClaimService],
    }).compile();

    controller = module.get<CalculateAdventureClaimController>(
      CalculateAdventureClaimController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
