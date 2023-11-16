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
import { ConnectUserService } from './connect-user.service';
import { CreateConnectUserDto } from './dto/create-connect-user.dto';
import { UpdateConnectUserDto } from './dto/update-connect-user.dto';
import { IRateLimitRule, Util } from '../../util';
import { Request } from 'express';
import { ERateLimitPageKey } from '../../utility/enums';

@Controller('chain/connect-user')
export class ConnectUserController {
  constructor(private readonly connectUserService: ConnectUserService) {}

  @Post()
  async create(
    @Body() createConnectUserDto: CreateConnectUserDto,
    @Req() req: Request,
  ) {
    await Util.checkLaunchModeStatus((req as any).ethAddress);

    if (await Util.isUserConnected((req as any).ethAddress)) {
      throw new BadRequestException(
        'You must disconnect to the system before taking this action.',
      );
    }

    const rateLimited: IRateLimitRule = await Util.rateLimitPage(
      ERateLimitPageKey.CONNECT_USER,
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
      return this.connectUserService.create(createConnectUserDto, req);
    }
  }

  @Get()
  findAll() {
    return this.connectUserService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.connectUserService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateConnectUserDto: UpdateConnectUserDto,
  ) {
    return this.connectUserService.update(+id, updateConnectUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.connectUserService.remove(+id);
  }
}
