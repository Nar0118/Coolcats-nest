/*
 * Copyright (c) 2021. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Christopher Hassett
 */

import { PartialType } from '@nestjs/mapped-types';
import { CreateClaimGoldDto } from './create-claim-gold.dto';

export class UpdateClaimGoldDto extends PartialType(CreateClaimGoldDto) {}
