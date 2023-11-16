/*
 * Copyright (c) 2021. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Christopher Hassett
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConnectUserService } from './connect-user.service';

describe('ConnectUserService', () => {
  let service: ConnectUserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConnectUserService],
    }).compile();

    service = module.get<ConnectUserService>(ConnectUserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
