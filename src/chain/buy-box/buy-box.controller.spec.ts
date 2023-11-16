/*
 * Copyright (c) 2021. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Christopher Hassett
 */

import { Test, TestingModule } from '@nestjs/testing';
import { BuyBoxController } from './buy-box.controller';
import { BuyBoxService } from './buy-box.service';

describe('BuyBoxController', () => {
  let controller: BuyBoxController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BuyBoxController],
      providers: [BuyBoxService],
    }).compile();

    controller = module.get<BuyBoxController>(BuyBoxController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
