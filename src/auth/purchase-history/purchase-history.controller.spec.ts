import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseHistoryController } from './purchase-history.controller';
import { PurchaseHistoryService } from './purchase-history.service';

describe('PurchaseHistoryController', () => {
  let controller: PurchaseHistoryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PurchaseHistoryController],
      providers: [PurchaseHistoryService],
    }).compile();

    controller = module.get<PurchaseHistoryController>(
      PurchaseHistoryController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
