/*
 * Copyright (c) 2021. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Christopher Hassett
 */

import { PartialType } from '@nestjs/mapped-types';
import { CreatePetInteractionDto } from './create-pet-interaction.dto';

export class UpdatePetInteractionDto extends PartialType(
  CreatePetInteractionDto,
) {}
