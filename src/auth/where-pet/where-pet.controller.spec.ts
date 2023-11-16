import { Test, TestingModule } from '@nestjs/testing';
import { WherePetController } from './where-pet.controller';
import { WherePetService } from './where-pet.service';

describe('WherePetController', () => {
  let controller: WherePetController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WherePetController],
      providers: [WherePetService],
    }).compile();

    controller = module.get<WherePetController>(WherePetController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
