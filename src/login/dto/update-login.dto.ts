/*
 * Copyright (c) 2021. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Christopher Hassett
 */

import { PartialType } from '@nestjs/mapped-types';
import { CreateLoginDto } from './create-login.dto';

export class UpdateLoginDto extends PartialType(CreateLoginDto) {}
