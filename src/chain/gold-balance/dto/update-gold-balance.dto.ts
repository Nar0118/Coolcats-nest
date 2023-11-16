/*
 * Copyright (c) 2021. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Christopher Hassett
 */

import { PartialType } from '@nestjs/mapped-types';
import { CreateGoldBalanceDto } from './create-gold-balance.dto';

export class UpdateGoldBalanceDto extends PartialType(CreateGoldBalanceDto) {}
