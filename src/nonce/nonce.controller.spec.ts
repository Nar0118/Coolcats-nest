/*
 * Copyright (c) 2021. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Christopher Hassett
 */

import { Test, TestingModule } from '@nestjs/testing';
import { NonceController } from './nonce.controller';
import { NonceService } from './nonce.service';

describe('NonceController', () => {
  let controller: NonceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NonceController],
      providers: [NonceService],
    }).compile();

    controller = module.get<NonceController>(NonceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
