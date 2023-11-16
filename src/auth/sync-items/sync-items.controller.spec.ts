import { Test, TestingModule } from '@nestjs/testing';
import { SyncItemsController } from './sync-items.controller';
import { SyncItemsService } from './sync-items.service';

describe('SyncItemsController', () => {
  let controller: SyncItemsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SyncItemsController],
      providers: [SyncItemsService],
    }).compile();

    controller = module.get<SyncItemsController>(SyncItemsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
