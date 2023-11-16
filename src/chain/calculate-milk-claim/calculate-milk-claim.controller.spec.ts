import { Test, TestingModule } from '@nestjs/testing';
import { CalculateMilkClaimController } from './calculate-milk-claim.controller';
import { CalculateMilkClaimService } from './calculate-milk-claim.service';

describe('CalculateMilkClaimController', () => {
  let controller: CalculateMilkClaimController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CalculateMilkClaimController],
      providers: [CalculateMilkClaimService],
    }).compile();

    controller = module.get<CalculateMilkClaimController>(
      CalculateMilkClaimController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
