import { Test, TestingModule } from '@nestjs/testing';
import { ListItemService } from './list-item.service';

describe('ListItemService', () => {
  let service: ListItemService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ListItemService],
    }).compile();

    service = module.get<ListItemService>(ListItemService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
