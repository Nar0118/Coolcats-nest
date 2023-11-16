import { Test, TestingModule } from '@nestjs/testing';
import { ListContractsController } from './list-contracts.controller';
import { ListContractsService } from './list-contracts.service';

describe('ListContractsController', () => {
  let controller: ListContractsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ListContractsController],
      providers: [ListContractsService],
    }).compile();

    controller = module.get<ListContractsController>(ListContractsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
