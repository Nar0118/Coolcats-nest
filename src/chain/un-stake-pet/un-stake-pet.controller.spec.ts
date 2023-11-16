import { Test, TestingModule } from '@nestjs/testing';
import { UnStakePetController } from './un-stake-pet.controller';
import { UnStakePetService } from './un-stake-pet.service';

describe('UnStakePetController', () => {
  let controller: UnStakePetController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UnStakePetController],
      providers: [UnStakePetService],
    }).compile();

    controller = module.get<UnStakePetController>(UnStakePetController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
