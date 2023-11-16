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
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { BuyBoxService } from './buy-box.service';
import { CreateBuyBoxDto } from './dto/create-buy-box.dto';
import { UpdateBuyBoxDto } from './dto/update-buy-box.dto';
import { Request } from 'express';
import { IRateLimitRule, Util } from '../../util';
import { ERateLimitPageKey } from '../../utility/enums';

@Controller('chain/buy-box')
export class BuyBoxController {
  constructor(private readonly buyBoxService: BuyBoxService) {}

  @Post()
  async create(@Body() createBuyBoxDto: CreateBuyBoxDto, @Req() req: Request) {
    await Util.checkLaunchModeStatus((req as any).ethAddress);

    if (!(await Util.isUserConnected((req as any).ethAddress))) {
      throw new BadRequestException(
        'You must connect to the system before taking this action.',
      );
    }

    const rateLimited: IRateLimitRule = await Util.rateLimitPage(
      ERateLimitPageKey.BUY_BOX,
      (req as any).clientIp,
    );
    if (rateLimited) {
      throw new HttpException('rate limited', 429);
    } else {
      const chainRateLimited: IRateLimitRule = await Util.rateLimitChainCalls(
        (req as any).ethAddress,
      );
      if (chainRateLimited) {
        const maxFrequencySecs: number = Math.floor(
          chainRateLimited.windowSecs / 3600,
        );

        throw new HttpException(
          {
            message: `You can only make ${
              chainRateLimited.maxHits
            } blockchain calls every ${maxFrequencySecs} hour${
              maxFrequencySecs > 1 ? 's' : ''
            }.`,
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            rule: JSON.stringify(chainRateLimited),
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      return await this.buyBoxService.create(createBuyBoxDto, req);
    }
  }

  @Get()
  findAll() {
    return this.buyBoxService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.buyBoxService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBuyBoxDto: UpdateBuyBoxDto) {
    return this.buyBoxService.update(+id, updateBuyBoxDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.buyBoxService.remove(+id);
  }
}
