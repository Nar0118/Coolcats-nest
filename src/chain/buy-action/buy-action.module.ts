/*
 * Copyright (c) 2021. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Sveta Danielyan
 */

import { Module } from '@nestjs/common';
import { BuyActionService } from './buy-action.service';
import { BuyActionController } from './buy-action.controller';
import { DatabaseModule } from '../../database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [BuyActionController],
  providers: [BuyActionService],
})
export class BuyActionModule {}
