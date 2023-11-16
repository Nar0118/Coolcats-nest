/*
 * Copyright (c) 2021. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Christopher Hassett
 */

import { Test, TestingModule } from '@nestjs/testing';
import { PetController } from './pet.controller';
import { PetService } from './pet.service';

describe('PetController', () => {
  let controller: PetController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PetController],
      providers: [PetService],
    }).compile();

    controller = module.get<PetController>(PetController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
