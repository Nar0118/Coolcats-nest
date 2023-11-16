/*
 * Copyright (c) 2022. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Christopher Hassett
 */

import { IsNotEmpty } from 'class-validator';

export class CreateWherePetDto {
  @IsNotEmpty()
  token_id: string;
}
