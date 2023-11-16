/*
 * Copyright (c) 2022. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Christopher Hassett
 */

import { IsString } from 'class-validator';

export class CreatePurchaseItemDto {
  @IsString()
  listingId: string;
}
