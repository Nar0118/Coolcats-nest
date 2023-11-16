/*
 * Copyright (c) 2021. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Christopher Hassett
 */

import {
  IsEthereumAddress,
  IsUUID,
  MinLength,
  IsString,
} from 'class-validator';

export class CreateLoginDto {
  @IsEthereumAddress()
  address: string;

  @IsUUID('4')
  nonce: string;

  @MinLength(1)
  signature: string;
}
