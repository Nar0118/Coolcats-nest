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
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { UserPropertyService } from './user-property.service';
import { CreateUserPropertyDto } from './dto/create-user-property.dto';
import { UpdateUserPropertyDto } from './dto/update-user-property.dto';
import { Request } from 'express';
import { IRateLimitRule, Util } from '../../util';
import { ERateLimitPageKey } from '../../utility/enums';

@Controller('auth/user-property')
export class UserPropertyController {
  constructor(private readonly userPropertyService: UserPropertyService) {}

  @Post()
  async create(
    @Body() createUserPropertyDto: CreateUserPropertyDto,
    @Req() req: Request,
  ) {
    const rateLimited: IRateLimitRule = await Util.rateLimitPage(
      ERateLimitPageKey.USER_PROPERTY,
      (req as any).clientIp,
    );
    if (rateLimited) {
      throw new HttpException('rate limited', 429);
    } else {
      await this.isValidWallet((req as any).ethAddress);

      return this.userPropertyService.create(createUserPropertyDto, req);
    }
  }

  @Get()
  async findAll(@Req() req: Request) {
    const rateLimited: IRateLimitRule = await Util.rateLimitPage(
      ERateLimitPageKey.USER_PROPERTY,
      (req as any).clientIp,
    );
    if (rateLimited) {
      throw new HttpException('rate limited', 429);
    } else {
      await this.isValidWallet((req as any).ethAddress);

      return this.userPropertyService.findAll(req);
    }
  }

  @Get(':name')
  async findOne(@Param('name') name: string, @Req() req: Request) {
    const rateLimited: IRateLimitRule = await Util.rateLimitPage(
      ERateLimitPageKey.USER_PROPERTY,
      (req as any).clientIp,
    );
    if (rateLimited) {
      throw new HttpException('rate limited', 429);
    } else {
      await this.isValidWallet((req as any).ethAddress);

      return this.userPropertyService.findOne(name, req);
    }
  }

  @Patch(':name')
  async update(
    @Param('name') name: string,
    @Body() updateUserPropertyDto: UpdateUserPropertyDto,
    @Req() req: Request,
  ) {
    const rateLimited: IRateLimitRule = await Util.rateLimitPage(
      ERateLimitPageKey.USER_PROPERTY,
      (req as any).clientIp,
    );
    if (rateLimited) {
      throw new HttpException('rate limited', 429);
    } else {
      await this.isValidWallet((req as any).ethAddress);

      return this.userPropertyService.update(name, updateUserPropertyDto, req);
    }
  }

  @Delete(':name')
  async remove(@Param('name') name: string, @Req() req: Request) {
    const rateLimited: IRateLimitRule = await Util.rateLimitPage(
      ERateLimitPageKey.USER_PROPERTY,
      (req as any).clientIp,
    );
    if (rateLimited) {
      throw new HttpException('rate limited', 429);
    } else {
      await this.isValidWallet((req as any).ethAddress);

      return this.userPropertyService.remove(name, req);
    }
  }

  async isValidWallet(address: string) {
    const walletRateLimited: IRateLimitRule = await Util.rateLimitPage(
      ERateLimitPageKey.LOGIN,
      address,
    );
    if (walletRateLimited) {
      throw new HttpException('This wallet is rate limited.', 429);
    }

    await Util.mustHavePetOrCat(address);
  }
}
