/*
 * Copyright (c) 2021. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Christopher Hassett
 */

import { IsAscii } from 'class-validator';

export class CreatePetInteractionDto {
  @IsAscii()
  petTokenId: string;

  @IsAscii()
  itemTokenIds: string;
}
