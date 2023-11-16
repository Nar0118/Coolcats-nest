/*
 * Copyright (c) 2021. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Christopher Hassett
 */

import { Test, TestingModule } from '@nestjs/testing';
import { PetInteractionController } from './pet-interaction.controller';
import { PetInteractionService } from './pet-interaction.service';

describe('PetInteractionController', () => {
  let controller: PetInteractionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PetInteractionController],
      providers: [PetInteractionService],
    }).compile();

    controller = module.get<PetInteractionController>(PetInteractionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
