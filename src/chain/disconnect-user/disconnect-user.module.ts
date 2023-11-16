/*
 * Copyright (c) 2021. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Christopher Hassett
 */

import { Module } from '@nestjs/common';
import { DisconnectUserService } from './disconnect-user.service';
import { DisconnectUserController } from './disconnect-user.controller';

@Module({
  controllers: [DisconnectUserController],
  providers: [DisconnectUserService],
})
export class DisconnectUserModule {}
