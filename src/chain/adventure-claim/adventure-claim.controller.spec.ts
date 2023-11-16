import { Test, TestingModule } from '@nestjs/testing';
import { AdventureClaimController } from './adventure-claim.controller';
import { AdventureClaimService } from './adventure-claim.service';

describe('AdventureClaimController', () => {
  let controller: AdventureClaimController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdventureClaimController],
      providers: [AdventureClaimService],
    }).compile();

    controller = module.get<AdventureClaimController>(AdventureClaimController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
