/*
 * Copyright (c) 2021. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Christopher Hassett
 */

import { PartialType } from '@nestjs/mapped-types';
import { CreateBuyBoxDto } from './create-buy-box.dto';

export class UpdateBuyBoxDto extends PartialType(CreateBuyBoxDto) {}
