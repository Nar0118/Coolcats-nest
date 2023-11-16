/*
 * Copyright (c) 2021. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Christopher Hassett
 */

import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { GoldBalanceService } from './gold-balance.service';
import { CreateGoldBalanceDto } from './dto/create-gold-balance.dto';
import { UpdateGoldBalanceDto } from './dto/update-gold-balance.dto';
import { Request } from 'express';
import { IRateLimitRule, Util } from '../../util';
import { ERateLimitPageKey } from '../../utility/enums';

@Controller('chain/gold-balance')
export class GoldBalanceController {
  constructor(private readonly goldBalanceService: GoldBalanceService) {}

  @Post()
  create(@Body() createGoldBalanceDto: CreateGoldBalanceDto) {
    return this.goldBalanceService.create(createGoldBalanceDto);
  }

  @Get()
  async findAll(@Req() req: Request) {
    if (!(await Util.isUserConnected((req as any).ethAddress))) {
      throw new BadRequestException(
        'You must connect to the system before taking this action.',
      );
    }

    const rateLimited: IRateLimitRule = await Util.rateLimitPage(
      ERateLimitPageKey.GOLD_BALANCE,
      (req as any).clientIp,
    );
    if (rateLimited) {
      throw new HttpException('rate limited', 429);
    } else {
      // We do not have to chainRateLimit the gold-balance call because it does not go to the back end blockchain
      // const chainRateLimited: IRateLimitRule = await Util.rateLimitChainCalls((req as any).ethAddress);
      // if (chainRateLimited) {
      //   const maxFreqiuencySecs: number = Math.floor(chainRateLimited.windowSecs / 3600);
      //   throw new HttpException(`You can only make ${chainRateLimited.maxHits} blockchain calls every ${maxFreqiuencySecs} hours.`, 429);
      // }
      return this.goldBalanceService.findAll(req);
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.goldBalanceService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateGoldBalanceDto: UpdateGoldBalanceDto,
  ) {
    return this.goldBalanceService.update(+id, updateGoldBalanceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.goldBalanceService.remove(+id);
  }
}
