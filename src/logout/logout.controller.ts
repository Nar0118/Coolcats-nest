/*
 * Copyright (c) 2021. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Christopher Hassett
 */

import {
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
  Res,
} from '@nestjs/common';
import { LogoutService } from './logout.service';
import { CreateLogoutDto } from './dto/create-logout.dto';
import { UpdateLogoutDto } from './dto/update-logout.dto';
import { Request, Response } from 'express';
import { IRateLimitRule, Util } from '../util';
import { ERateLimitPageKey } from '../utility/enums';

@Controller('logout')
export class LogoutController {
  constructor(private readonly logoutService: LogoutService) {}

  @Post()
  async create(
    @Body() createLogoutDto: CreateLogoutDto,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    const rateLimited: IRateLimitRule = await Util.rateLimitPage(
      ERateLimitPageKey.LOGOUT,
      (req as any).clientIp,
    );
    if (rateLimited) {
      throw new HttpException('rate limited', 429);
    } else {
      const payload: any = this.logoutService.create(createLogoutDto, res);
      res.status(HttpStatus.CREATED).json(payload);
    }
  }

  @Get()
  findAll() {
    return this.logoutService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.logoutService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateLogoutDto: UpdateLogoutDto) {
    return this.logoutService.update(+id, updateLogoutDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.logoutService.remove(+id);
  }
}
