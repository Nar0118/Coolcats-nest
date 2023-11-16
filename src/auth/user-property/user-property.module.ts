/*
 * Copyright (c) 2021. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Christopher Hassett
 */

import { Module } from '@nestjs/common';
import { UserPropertyService } from './user-property.service';
import { UserPropertyController } from './user-property.controller';
import { DatabaseModule } from '../../database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [UserPropertyController],
  providers: [UserPropertyService],
})
export class UserPropertyModule {}
