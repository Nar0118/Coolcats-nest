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
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { CatService } from './cat.service';
import { CreateCatDto } from './dto/create-cat.dto';
import { UpdateCatDto } from './dto/update-cat.dto';
import { Request } from 'express';
import { IRateLimitRule, Util } from '../util';
import { ERateLimitPageKey } from '../utility/enums';

@Controller('cat')
export class CatController {
  constructor(private readonly catService: CatService) {}

  @Post()
  create(@Body() createCatDto: CreateCatDto) {
    return this.catService.create(createCatDto);
  }

  @Get()
  async findAll(@Query() query, @Req() req: Request) {
    const rateLimited: IRateLimitRule = await Util.rateLimitPage(
      ERateLimitPageKey.CAT,
      (req as any).clientIp,
    );
    if (rateLimited) {
      throw new HttpException('rate limited', 429);
    } else {
      return await this.catService.findAll(query);
    }
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: string, @Req() req: Request) {
    const rateLimited: IRateLimitRule = await Util.rateLimitPage(
      ERateLimitPageKey.CAT,
      (req as any).clientIp,
    );
    if (rateLimited) {
      throw new HttpException('rate limited', 429);
    } else {
      return await this.catService.findOne(+id);
    }
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCatDto: UpdateCatDto) {
    return this.catService.update(+id, updateCatDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.catService.remove(+id);
  }
}
