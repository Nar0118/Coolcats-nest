/*
 * Copyright (c) 2021. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Christopher Hassett
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  Res,
  HttpStatus,
  BadRequestException,
  HttpException,
} from '@nestjs/common';
import { ClaimGoldService } from './claim-gold.service';
import { CreateClaimGoldDto } from './dto/create-claim-gold.dto';
import { UpdateClaimGoldDto } from './dto/update-claim-gold.dto';
import { Request, Response } from 'express';
import { IRateLimitRule, Util } from '../../util';

@Controller('chain/claim-gold')
export class ClaimGoldController {
  constructor(private readonly claimGoldService: ClaimGoldService) {}

  @Post()
  async create(
    @Body() createClaimGoldDto: CreateClaimGoldDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    if (!(await Util.isUserConnected((req as any).ethAddress))) {
      throw new BadRequestException(
        'You must connect to the system before taking this action.',
      );
    }

    const payload: any = await this.claimGoldService.create(
      createClaimGoldDto,
      req,
      res,
    );
    if (payload.rateLimited) {
      res.status(HttpStatus.TOO_MANY_REQUESTS).json(payload);
    } else {
      // Don't really need to count the gold claim because it is already rate limited

      // const chainRateLimited: IRateLimitRule = await Util.rateLimitChainCalls((req as any).ethAddress);
      // if (chainRateLimited) {
      //   const maxFreqiuencySecs: number = Math.floor(chainRateLimited.windowSecs / 3600);
      //   throw new HttpException(`You can only make ${chainRateLimited.maxHits} blockchain calls every ${maxFreqiuencySecs} hours.`, 429);
      // }
      res.status(HttpStatus.CREATED).json(payload);
    }
  }

  @Get()
  findAll() {
    return this.claimGoldService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.claimGoldService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateClaimGoldDto: UpdateClaimGoldDto,
  ) {
    return this.claimGoldService.update(+id, updateClaimGoldDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.claimGoldService.remove(+id);
  }
}
