/*
 * Copyright (c) 2021. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Christopher Hassett
 */
import { Module } from '@nestjs/common';
import { PetManagerService } from './pet-manager.service';

@Module({
  providers: [PetManagerService],
  exports: [PetManagerService],
})
export class PetManagerModule {}
