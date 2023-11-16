/*
 * Copyright (c) 2021. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Christopher Hassett
 */

import { Module } from '@nestjs/common';
import { ClaimGoldService } from './claim-gold.service';
import { ClaimGoldController } from './claim-gold.controller';
import { DatabaseModule } from '../../database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ClaimGoldController],
  providers: [ClaimGoldService],
})
export class ClaimGoldModule {}
