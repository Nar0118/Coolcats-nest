import { Test, TestingModule } from '@nestjs/testing';
import { DelistItemController } from './delist-item.controller';
import { DelistItemService } from './delist-item.service';

describe('DelistItemController', () => {
  let controller: DelistItemController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DelistItemController],
      providers: [DelistItemService],
    }).compile();

    controller = module.get<DelistItemController>(DelistItemController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
