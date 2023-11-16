/*
 * Copyright (c) 2021. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Christopher Hassett
 */

import { Module } from '@nestjs/common';
import { BuyBoxService } from './buy-box.service';
import { BuyBoxController } from './buy-box.controller';
import { DatabaseModule } from '../../database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [BuyBoxController],
  providers: [BuyBoxService],
})
export class BuyBoxModule {}
