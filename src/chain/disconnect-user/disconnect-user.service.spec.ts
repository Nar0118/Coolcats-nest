/*
 * Copyright (c) 2021. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Christopher Hassett
 */

import { Test, TestingModule } from '@nestjs/testing';
import { DisconnectUserService } from './disconnect-user.service';

describe('DisconnectUserService', () => {
  let service: DisconnectUserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DisconnectUserService],
    }).compile();

    service = module.get<DisconnectUserService>(DisconnectUserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
