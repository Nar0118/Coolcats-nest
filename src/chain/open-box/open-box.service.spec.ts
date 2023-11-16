/*
 * Copyright (c) 2021. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Christopher Hassett
 */

import { Test, TestingModule } from '@nestjs/testing';
import { OpenBoxService } from './open-box.service';

describe('OpenBoxService', () => {
  let service: OpenBoxService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OpenBoxService],
    }).compile();

    service = module.get<OpenBoxService>(OpenBoxService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
