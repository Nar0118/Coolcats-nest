/*
 * Copyright (c) 2021. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Christopher Hassett
 */

import { Test, TestingModule } from '@nestjs/testing';
import { DisconnectUserController } from './disconnect-user.controller';
import { DisconnectUserService } from './disconnect-user.service';

describe('DisconnectUserController', () => {
  let controller: DisconnectUserController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DisconnectUserController],
      providers: [DisconnectUserService],
    }).compile();

    controller = module.get<DisconnectUserController>(DisconnectUserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
