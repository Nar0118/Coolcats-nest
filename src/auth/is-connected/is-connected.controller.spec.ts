import { Test, TestingModule } from '@nestjs/testing';
import { IsConnectedController } from './is-connected.controller';
import { IsConnectedService } from './is-connected.service';

describe('IsConnectedController', () => {
  let controller: IsConnectedController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IsConnectedController],
      providers: [IsConnectedService],
    }).compile();

    controller = module.get<IsConnectedController>(IsConnectedController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
