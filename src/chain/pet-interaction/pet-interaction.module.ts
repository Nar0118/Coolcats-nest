/*
 * Copyright (c) 2021. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Christopher Hassett
 */

import { Module } from '@nestjs/common';
import { PetInteractionService } from './pet-interaction.service';
import { PetInteractionController } from './pet-interaction.controller';

@Module({
  controllers: [PetInteractionController],
  providers: [PetInteractionService],
})
export class PetInteractionModule {}
