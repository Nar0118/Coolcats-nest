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
import { WhereCatService } from './where-cat.service';
import { CreateWhereCatDto } from './dto/create-where-cat.dto';
import { UpdateWhereCatDto } from './dto/update-where-cat.dto';
import { IRateLimitRule, Util } from '../../util';
import { Request } from 'express';
import { ERateLimitPageKey } from '../../utility/enums';

@Controller('auth/where-cat')
export class WhereCatController {
  constructor(private readonly whereCatService: WhereCatService) {}

  @Post()
  async create(
    @Body() createWhereCatDto: CreateWhereCatDto,
    @Req() req: Request,
  ) {
    const rateLimited: IRateLimitRule = await Util.rateLimitPage(
      ERateLimitPageKey.WHERE_CAT,
      (req as any).clientIp,
    );
    if (rateLimited) {
      throw new HttpException('rate limited', 429);
    } else {
      return this.whereCatService.create(createWhereCatDto);
    }
  }

  @Get()
  findAll() {
    return this.whereCatService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.whereCatService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateWhereCatDto: UpdateWhereCatDto,
  ) {
    return this.whereCatService.update(+id, updateWhereCatDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.whereCatService.remove(+id);
  }
}
