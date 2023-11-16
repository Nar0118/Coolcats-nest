/*
 * Copyright (c) 2021. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Christopher Hassett
 */

import { PartialType } from '@nestjs/mapped-types';
import { CreateDisconnectUserDto } from './create-disconnect-user.dto';

export class UpdateDisconnectUserDto extends PartialType(
  CreateDisconnectUserDto,
) {}
