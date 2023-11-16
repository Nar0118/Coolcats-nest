/*
 * Copyright (c) 2021. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Christopher Hassett
 */

import { Module } from '@nestjs/common';
import { ItemService } from './item.service';
import { ItemController } from './item.controller';
import { DatabaseModule } from '../../database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ItemController],
  providers: [ItemService],
})
export class ItemModule {}
