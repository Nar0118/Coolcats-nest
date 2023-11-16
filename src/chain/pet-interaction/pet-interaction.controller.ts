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
import { PetInteractionService } from './pet-interaction.service';
import { CreatePetInteractionDto } from './dto/create-pet-interaction.dto';
import { UpdatePetInteractionDto } from './dto/update-pet-interaction.dto';
import { Request } from 'express';
import { IRateLimitRule, Util } from '../../util';
import { ERateLimitPageKey } from '../../utility/enums';

@Controller('chain/pet-interaction')
export class PetInteractionController {
  constructor(private readonly petInteractionService: PetInteractionService) {}

  @Post()
  async create(
    @Body() createPetInteractionDto: CreatePetInteractionDto,
    @Req() req: Request,
  ) {
    await Util.checkLaunchModeStatus((req as any).ethAddress);

    if (!(await Util.isUserConnected((req as any).ethAddress))) {
      throw new BadRequestException(
        'You must connect to the system before taking this action.',
      );
    }

    const rateLimited: IRateLimitRule = await Util.rateLimitPage(
      ERateLimitPageKey.PET_INTERACTION,
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
      return await this.petInteractionService.create(
        createPetInteractionDto,
        req,
      );
    }
  }

  @Get()
  findAll() {
    return this.petInteractionService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.petInteractionService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePetInteractionDto: UpdatePetInteractionDto,
  ) {
    return this.petInteractionService.update(+id, updatePetInteractionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.petInteractionService.remove(+id);
  }
}
