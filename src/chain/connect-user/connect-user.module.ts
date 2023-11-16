/*
 * Copyright (c) 2021. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Christopher Hassett
 */

import { Module } from '@nestjs/common';
import { ConnectUserService } from './connect-user.service';
import { ConnectUserController } from './connect-user.controller';

@Module({
  controllers: [ConnectUserController],
  providers: [ConnectUserService],
})
export class ConnectUserModule {}
