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
import { DisconnectUserService } from './disconnect-user.service';
import { CreateDisconnectUserDto } from './dto/create-disconnect-user.dto';
import { UpdateDisconnectUserDto } from './dto/update-disconnect-user.dto';
import { Request } from 'express';
import { IRateLimitRule, Util } from '../../util';
import { ERateLimitPageKey } from '../../utility/enums';

@Controller('chain/disconnect-user')
export class DisconnectUserController {
  constructor(private readonly disconnectUserService: DisconnectUserService) {}

  @Post()
  async create(
    @Body() createDisconnectUserDto: CreateDisconnectUserDto,
    @Req() req: Request,
  ) {
    await Util.checkLaunchModeStatus((req as any).ethAddress);

    if (!(await Util.isUserConnected((req as any).ethAddress))) {
      throw new BadRequestException(
        'You must connect to the system before taking this action.',
      );
    }

    const rateLimited: IRateLimitRule = await Util.rateLimitPage(
      ERateLimitPageKey.DISCONNECT_USER,
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
      return this.disconnectUserService.create(createDisconnectUserDto, req);
    }
  }

  @Get()
  findAll() {
    return this.disconnectUserService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.disconnectUserService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDisconnectUserDto: UpdateDisconnectUserDto,
  ) {
    return this.disconnectUserService.update(+id, updateDisconnectUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.disconnectUserService.remove(+id);
  }
}
