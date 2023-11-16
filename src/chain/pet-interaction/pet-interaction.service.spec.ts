/*
 * Copyright (c) 2021. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Christopher Hassett
 */

import { Test, TestingModule } from '@nestjs/testing';
import { PetInteractionService } from './pet-interaction.service';

describe('PetInteractionService', () => {
  let service: PetInteractionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PetInteractionService],
    }).compile();

    service = module.get<PetInteractionService>(PetInteractionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
