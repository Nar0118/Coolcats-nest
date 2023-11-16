/*
 * Copyright (c) 2021. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Christopher Hassett
 */

import { Module } from '@nestjs/common';
import { NonceService } from './nonce.service';
import { NonceController } from './nonce.controller';
import { DatabaseModule } from '../database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [NonceController],
  providers: [NonceService],
})
export class NonceModule {}
