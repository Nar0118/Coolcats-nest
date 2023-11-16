/*
 * Copyright (c) 2021. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Sveta Danielyan
 */

import { PartialType } from '@nestjs/mapped-types';
import { CreateBuyActionDto } from './create-buy-action.dto';

export class UpdateBuyActionDto extends PartialType(CreateBuyActionDto) {}
