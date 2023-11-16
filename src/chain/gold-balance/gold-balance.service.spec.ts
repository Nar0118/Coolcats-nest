/*
 * Copyright (c) 2021. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Christopher Hassett
 */

import { Test, TestingModule } from '@nestjs/testing';
import { GoldBalanceService } from './gold-balance.service';

describe('GoldBalanceService', () => {
  let service: GoldBalanceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GoldBalanceService],
    }).compile();

    service = module.get<GoldBalanceService>(GoldBalanceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
