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
import { WherePetService } from './where-pet.service';
import { CreateWherePetDto } from './dto/create-where-pet.dto';
import { UpdateWherePetDto } from './dto/update-where-pet.dto';
import { Request } from 'express';
import { IRateLimitRule, Util } from '../../util';
import { ERateLimitPageKey } from '../../utility/enums';

@Controller('auth/where-pet')
export class WherePetController {
  constructor(private readonly wherePetService: WherePetService) {}

  @Post()
  async create(
    @Body() createWherePetDto: CreateWherePetDto,
    @Req() req: Request,
  ) {
    // We are going to rate limit this page 1 time per hour
    const wherePetRateLimit: IRateLimitRule[] = [
      { maxHits: 1, windowSecs: 10 },
    ];
    const rateLimited: IRateLimitRule = await Util.rateLimitPage(
      ERateLimitPageKey.WHERE_PET,
      (req as any).clientIp,
      wherePetRateLimit,
    );
    if (rateLimited) {
      throw new HttpException(
        'You have recently found your pet, try again later',
        429,
      );
    } else {
      return this.wherePetService.create(createWherePetDto, req);
    }
  }

  @Get()
  findAll() {
    return this.wherePetService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.wherePetService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateWherePetDto: UpdateWherePetDto,
  ) {
    return this.wherePetService.update(+id, updateWherePetDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.wherePetService.remove(+id);
  }
}
