/*
 * Copyright (c) 2022. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Adam Goodman
 */

import { IsBoolean, IsBooleanString } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateRollQuestDto {
  @Transform(({ value }) => {
    return value.toLowerCase() === 'true';
  })
  @IsBoolean()
  reRoll: string;
}
