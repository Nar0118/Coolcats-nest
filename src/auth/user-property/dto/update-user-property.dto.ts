/*
 * Copyright (c) 2021. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Christopher Hassett
 */

import { PartialType } from '@nestjs/mapped-types';
import { CreateUserPropertyDto } from './create-user-property.dto';

export class UpdateUserPropertyDto extends PartialType(CreateUserPropertyDto) {}
