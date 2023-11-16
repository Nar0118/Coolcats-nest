import { Test, TestingModule } from '@nestjs/testing';
import { PetActivityController } from './pet-activity.controller';
import { PetActivityService } from './pet-activity.service';

describe('PetActivityController', () => {
  let controller: PetActivityController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PetActivityController],
      providers: [PetActivityService],
    }).compile();

    controller = module.get<PetActivityController>(PetActivityController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
