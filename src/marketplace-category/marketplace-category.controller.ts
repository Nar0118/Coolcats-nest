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
import { MarketplaceCategoryService } from './marketplace-category.service';
import { CreateMarketplaceCategoryDto } from './dto/create-marketplace-category.dto';
import { UpdateMarketplaceCategoryDto } from './dto/update-marketplace-category.dto';
import { IRateLimitRule, Util } from '../util';
import { Request } from 'express';
import { ERateLimitPageKey } from '../utility/enums';

@Controller('marketplace-category')
export class MarketplaceCategoryController {
  constructor(
    private readonly marketplaceCategoryService: MarketplaceCategoryService,
  ) {}

  @Post()
  create(@Body() createMarketplaceCategoryDto: CreateMarketplaceCategoryDto) {
    return this.marketplaceCategoryService.create(createMarketplaceCategoryDto);
  }

  @Get()
  async findAll(@Req() req: Request) {
    const rateLimited: IRateLimitRule = await Util.rateLimitPage(
      ERateLimitPageKey.MARKETPLACE_CATEGORY,
      (req as any).clientIp,
    );
    if (rateLimited) {
      throw new HttpException('rate limited', 429);
    } else {
      return this.marketplaceCategoryService.findAll();
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.marketplaceCategoryService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateMarketplaceCategoryDto: UpdateMarketplaceCategoryDto,
  ) {
    return this.marketplaceCategoryService.update(
      +id,
      updateMarketplaceCategoryDto,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.marketplaceCategoryService.remove(+id);
  }
}
