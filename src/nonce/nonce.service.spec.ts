/*
 * Copyright (c) 2021. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Christopher Hassett
 */

import { Test, TestingModule } from '@nestjs/testing';
import { NonceService } from './nonce.service';

describe('NonceService', () => {
  let service: NonceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NonceService],
    }).compile();

    service = module.get<NonceService>(NonceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
