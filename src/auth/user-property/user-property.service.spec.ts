/*
 * Copyright (c) 2021. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Christopher Hassett
 */

import { Test, TestingModule } from '@nestjs/testing';
import { UserPropertyService } from './user-property.service';

describe('UserPropertyService', () => {
  let service: UserPropertyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserPropertyService],
    }).compile();

    service = module.get<UserPropertyService>(UserPropertyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
