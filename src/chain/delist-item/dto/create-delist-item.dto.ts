/*
 * Copyright (c) 2022. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Christopher Hassett
 */

import { IsString } from 'class-validator';

export class CreateDelistItemDto {
  @IsString()
  listingId: string;
}
