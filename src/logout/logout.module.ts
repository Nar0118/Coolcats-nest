/*
 * Copyright (c) 2021. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Christopher Hassett
 */

import { Module } from '@nestjs/common';
import { LogoutService } from './logout.service';
import { LogoutController } from './logout.controller';

@Module({
  controllers: [LogoutController],
  providers: [LogoutService],
})
export class LogoutModule {}
