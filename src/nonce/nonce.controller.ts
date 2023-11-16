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
  Query,
} from '@nestjs/common';
import { NonceService } from './nonce.service';
import { CreateNonceDto } from './dto/create-nonce.dto';
import { UpdateNonceDto } from './dto/update-nonce.dto';

@Controller('nonce')
export class NonceController {
  constructor(private readonly nonceService: NonceService) {}

  @Post()
  create(@Body() createNonceDto: CreateNonceDto) {
    return this.nonceService.create(createNonceDto);
  }

  @Get()
  findAll(@Req() req, @Query() query) {
    return this.nonceService.findAll(req, query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.nonceService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateNonceDto: UpdateNonceDto) {
    return this.nonceService.update(+id, updateNonceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.nonceService.remove(+id);
  }
}
