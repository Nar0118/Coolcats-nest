import { Test, TestingModule } from '@nestjs/testing';
import { IsConnectedService } from './is-connected.service';

describe('IsConnectedService', () => {
  let service: IsConnectedService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IsConnectedService],
    }).compile();

    service = module.get<IsConnectedService>(IsConnectedService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
