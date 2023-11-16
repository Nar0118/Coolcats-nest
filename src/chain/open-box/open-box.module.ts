/*
 * Copyright (c) 2021. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Christopher Hassett
 */

import { Module } from '@nestjs/common';
import { OpenBoxService } from './open-box.service';
import { OpenBoxController } from './open-box.controller';
import { DatabaseModule } from '../../database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [OpenBoxController],
  providers: [OpenBoxService],
})
export class OpenBoxModule {}
