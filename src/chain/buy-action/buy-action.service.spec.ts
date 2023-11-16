/*
 * Copyright (c) 2021. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Sveta Danielyan
 */

import { Test, TestingModule } from '@nestjs/testing';
import { BuyActionService } from './buy-action.service';

describe('BuyActionService', () => {
  let service: BuyActionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BuyActionService],
    }).compile();

    service = module.get<BuyActionService>(BuyActionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
