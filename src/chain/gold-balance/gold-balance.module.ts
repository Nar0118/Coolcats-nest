/*
 * Copyright (c) 2021. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Christopher Hassett
 */

import { Module } from '@nestjs/common';
import { GoldBalanceService } from './gold-balance.service';
import { GoldBalanceController } from './gold-balance.controller';

@Module({
  controllers: [GoldBalanceController],
  providers: [GoldBalanceService],
})
export class GoldBalanceModule {}
