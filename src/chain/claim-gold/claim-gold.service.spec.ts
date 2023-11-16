/*
 * Copyright (c) 2021. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Christopher Hassett
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ClaimGoldService } from './claim-gold.service';

describe('ClaimGoldService', () => {
  let service: ClaimGoldService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ClaimGoldService],
    }).compile();

    service = module.get<ClaimGoldService>(ClaimGoldService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
