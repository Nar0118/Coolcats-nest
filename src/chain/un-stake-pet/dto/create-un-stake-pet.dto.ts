/*
 * Copyright (c) 2022. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Christopher Hassett
 */

import { IsNotEmpty } from 'class-validator';

export class CreateUnStakePetDto {
  @IsNotEmpty()
  petIds: string;
}
