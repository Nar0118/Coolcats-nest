/*
 * Copyright (c) 2021. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Christopher Hassett
 */

import { PartialType } from '@nestjs/mapped-types';
import { CreateNonceDto } from './create-nonce.dto';

export class UpdateNonceDto extends PartialType(CreateNonceDto) {}
