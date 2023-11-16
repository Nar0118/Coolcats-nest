/*
 * Copyright (c) 2021. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Sveta Danielyan
 */

import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateBuyActionDto {
  @IsNotEmpty()
  @IsString()
  actionKey: string;

  @IsOptional()
  @IsString()
  discord_id: string;

  @IsOptional()
  @IsString()
  twitter_id: string;

  @IsOptional()
  @IsString()
  token_id: string;

  @IsString()
  type: string;

  @IsOptional()
  @IsString()
  details: string;
}
