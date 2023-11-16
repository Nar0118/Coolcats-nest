/*
 * Copyright (c) 2021. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Christopher Hassett
 */

import { Test, TestingModule } from '@nestjs/testing';
import { LogoutService } from './logout.service';

describe('LogoutService', () => {
  let service: LogoutService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LogoutService],
    }).compile();

    service = module.get<LogoutService>(LogoutService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
