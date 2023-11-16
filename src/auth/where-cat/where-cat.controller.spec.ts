import { Test, TestingModule } from '@nestjs/testing';
import { WhereCatController } from './where-cat.controller';
import { WhereCatService } from './where-cat.service';

describe('WhereCatController', () => {
  let controller: WhereCatController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WhereCatController],
      providers: [WhereCatService],
    }).compile();

    controller = module.get<WhereCatController>(WhereCatController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
