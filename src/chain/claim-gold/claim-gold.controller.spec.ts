/*
 * Copyright (c) 2021. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Christopher Hassett
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ClaimGoldController } from './claim-gold.controller';
import { ClaimGoldService } from './claim-gold.service';

describe('ClaimGoldController', () => {
  let controller: ClaimGoldController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClaimGoldController],
      providers: [ClaimGoldService],
    }).compile();

    controller = module.get<ClaimGoldController>(ClaimGoldController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
