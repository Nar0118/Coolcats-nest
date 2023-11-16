/*
 * Copyright (c) 2021. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Christopher Hassett
 */

import { Test, TestingModule } from '@nestjs/testing';
import { CatController } from './cat.controller';
import { CatService } from './cat.service';

describe('CatController', () => {
  let controller: CatController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CatController],
      providers: [CatService],
    }).compile();

    controller = module.get<CatController>(CatController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
