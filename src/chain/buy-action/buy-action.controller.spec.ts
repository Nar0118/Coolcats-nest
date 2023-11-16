/*
 * Copyright (c) 2021. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Sveta Danielyan
 */

import { Test, TestingModule } from '@nestjs/testing';
import { BuyActionController } from './buy-action.controller';
import { BuyActionService } from './buy-action.service';

describe('BuyActionController', () => {
  let controller: BuyActionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BuyActionController],
      providers: [BuyActionService],
    }).compile();

    controller = module.get<BuyActionController>(BuyActionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
