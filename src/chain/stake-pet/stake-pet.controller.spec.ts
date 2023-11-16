import { Test, TestingModule } from '@nestjs/testing';
import { StakePetController } from './stake-pet.controller';
import { StakePetService } from './stake-pet.service';

describe('StakePetController', () => {
  let controller: StakePetController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StakePetController],
      providers: [StakePetService],
    }).compile();

    controller = module.get<StakePetController>(StakePetController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
