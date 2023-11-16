/*
 * Copyright (c) 2021. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Christopher Hassett
 */

import { IsAlphanumeric, IsAscii, MaxLength } from 'class-validator';

export class CreateUserPropertyDto {
  @MaxLength(100, { message: 'key property must be 100 or less in length' })
  @IsAlphanumeric()
  key: string;

  @IsAscii()
  value: string;
}
