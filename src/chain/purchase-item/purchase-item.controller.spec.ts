import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseItemController } from './purchase-item.controller';
import { PurchaseItemService } from './purchase-item.service';

describe('PurchaseItemController', () => {
  let controller: PurchaseItemController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PurchaseItemController],
      providers: [PurchaseItemService],
    }).compile();

    controller = module.get<PurchaseItemController>(PurchaseItemController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
