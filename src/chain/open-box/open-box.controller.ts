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
import { OpenBoxService } from './open-box.service';
import { CreateOpenBoxDto } from './dto/create-open-box.dto';
import { UpdateOpenBoxDto } from './dto/update-open-box.dto';
import { Request } from 'express';
import { IRateLimitRule, Util } from '../../util';
import { ERateLimitPageKey } from '../../utility/enums';

@Controller('/chain/open-box')
export class OpenBoxController {
  constructor(private readonly openBoxService: OpenBoxService) {}

  @Post()
  async create(
    @Body() createOpenBoxDto: CreateOpenBoxDto,
    @Req() req: Request,
  ) {
    await Util.checkLaunchModeStatus((req as any).ethAddress);

    if (!(await Util.isUserConnected((req as any).ethAddress))) {
      throw new BadRequestException(
        'You must connect to the system before taking this action.',
      );
    }

    const rateLimited: IRateLimitRule = await Util.rateLimitPage(
      ERateLimitPageKey.OPEN_BOX,
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
      return await this.openBoxService.create(createOpenBoxDto, req);
    }
  }

  @Get()
  findAll() {
    return this.openBoxService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.openBoxService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOpenBoxDto: UpdateOpenBoxDto) {
    return this.openBoxService.update(+id, updateOpenBoxDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.openBoxService.remove(+id);
  }
}
