/*
 * Copyright (c) 2021. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Adam Goodman
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
  Query,
  Req,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ListContractsService } from './list-contracts.service';
import { CreateListContractDto } from './dto/create-list-contract.dto';
import { UpdateListContractDto } from './dto/update-list-contract.dto';
import { IsBoolean, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { IRateLimitRule, Util } from '../util';
import { Request } from 'express';
import { ERateLimitPageKey } from '../utility/enums';

export class ListContractDto {
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  abi: boolean;
}

@Controller('list-contracts')
export class ListContractsController {
  constructor(private readonly listContractsService: ListContractsService) {}

  @Post()
  create(@Body() createListContractDto: CreateListContractDto) {
    return this.listContractsService.create(createListContractDto);
  }

  @Get()
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async findAll(@Query() query: ListContractDto, @Req() req: Request) {
    const rateLimited: IRateLimitRule = await Util.rateLimitPage(
      ERateLimitPageKey.LIST_CONTRACTS,
      (req as any).clientIp,
    );
    if (rateLimited) {
      throw new HttpException('rate limited', 429);
    } else {
      return await this.listContractsService.findAll(query);
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.listContractsService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateListContractDto: UpdateListContractDto,
  ) {
    return this.listContractsService.update(+id, updateListContractDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.listContractsService.remove(+id);
  }
}
