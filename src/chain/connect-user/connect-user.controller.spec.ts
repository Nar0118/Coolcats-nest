/*
 * Copyright (c) 2021. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Christopher Hassett
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConnectUserController } from './connect-user.controller';
import { ConnectUserService } from './connect-user.service';

describe('ConnectUserController', () => {
  let controller: ConnectUserController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConnectUserController],
      providers: [ConnectUserService],
    }).compile();

    controller = module.get<ConnectUserController>(ConnectUserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
