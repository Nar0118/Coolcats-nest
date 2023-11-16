/*
 * Copyright (c) 2021. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Christopher Hassett
 */

import { Test, TestingModule } from '@nestjs/testing';
import { OpenBoxController } from './open-box.controller';
import { OpenBoxService } from './open-box.service';

describe('OpenBoxController', () => {
  let controller: OpenBoxController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OpenBoxController],
      providers: [OpenBoxService],
    }).compile();

    controller = module.get<OpenBoxController>(OpenBoxController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
