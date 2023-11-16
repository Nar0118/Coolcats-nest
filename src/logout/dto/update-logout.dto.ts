/*
 * Copyright (c) 2021. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Christopher Hassett
 */

import { PartialType } from '@nestjs/mapped-types';
import { CreateLogoutDto } from './create-logout.dto';

export class UpdateLogoutDto extends PartialType(CreateLogoutDto) {}
