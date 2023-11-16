/*
 * Copyright (c) 2021. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Christopher Hassett
 */

import { PartialType } from '@nestjs/mapped-types';
import { CreateConnectUserDto } from './create-connect-user.dto';

export class UpdateConnectUserDto extends PartialType(CreateConnectUserDto) {}
