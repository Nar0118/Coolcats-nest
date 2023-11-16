/*
 * Copyright (c) 2021. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Christopher Hassett
 */

import {
  IsEthereumAddress,
  IsInt,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';

export class CreateClaimGoldDto {
  @IsEthereumAddress()
  address: string;

  @IsOptional()
  ids: string;
}
