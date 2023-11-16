/*
 * Copyright (c) 2021. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Christopher Hassett
 */

import { IsEthereumAddress, IsInt, IsNotEmpty } from 'class-validator';

export class CreateConnectUserDto {
  @IsEthereumAddress()
  address: string;

  @IsNotEmpty()
  nonce: string;

  @IsNotEmpty()
  signature: string;

  @IsNotEmpty()
  ledger: string;
}
