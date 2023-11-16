/*
 * Copyright (c) 2021. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Christopher Hassett
 */

import { PartialType } from '@nestjs/mapped-types';
import { CreateOpenBoxDto } from './create-open-box.dto';

export class UpdateOpenBoxDto extends PartialType(CreateOpenBoxDto) {}
