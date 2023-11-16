/*
 * Copyright (c) 2021. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Christopher Hassett
 */

import { Test, TestingModule } from '@nestjs/testing';
import { BuyBoxService } from './buy-box.service';

describe('BuyBoxService', () => {
  let service: BuyBoxService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BuyBoxService],
    }).compile();

    service = module.get<BuyBoxService>(BuyBoxService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
