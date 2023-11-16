/*
 * Copyright (c) 2021. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Christopher Hassett
 */

import { Test, TestingModule } from '@nestjs/testing';
import { LogoutController } from './logout.controller';
import { LogoutService } from './logout.service';

describe('LogoutController', () => {
  let controller: LogoutController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LogoutController],
      providers: [LogoutService],
    }).compile();

    controller = module.get<LogoutController>(LogoutController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
