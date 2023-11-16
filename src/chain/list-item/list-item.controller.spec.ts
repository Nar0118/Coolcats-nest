import { Test, TestingModule } from '@nestjs/testing';
import { ListItemController } from './list-item.controller';
import { ListItemService } from './list-item.service';

describe('ListItemController', () => {
  let controller: ListItemController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ListItemController],
      providers: [ListItemService],
    }).compile();

    controller = module.get<ListItemController>(ListItemController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
