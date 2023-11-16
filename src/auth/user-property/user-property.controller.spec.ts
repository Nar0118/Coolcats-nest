/*
 * Copyright (c) 2021. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Christopher Hassett
 */

import { Test, TestingModule } from '@nestjs/testing';
import { UserPropertyController } from './user-property.controller';
import { UserPropertyService } from './user-property.service';

describe('UserPropertyController', () => {
  let controller: UserPropertyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserPropertyController],
      providers: [UserPropertyService],
    }).compile();

    controller = module.get<UserPropertyController>(UserPropertyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
