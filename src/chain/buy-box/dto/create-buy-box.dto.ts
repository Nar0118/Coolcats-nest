/*
 * Copyright (c) 2021. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Christopher Hassett
 */

import { IsString } from 'class-validator';

export class CreateBuyBoxDto {
  @IsString()
  quantity: string;
}
