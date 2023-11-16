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
} from '@nestjs/common';
import { MarketplaceService } from './marketplace.service';
import { CreateMarketplaceDto } from './dto/create-marketplace.dto';
import { UpdateMarketplaceDto } from './dto/update-marketplace.dto';
import { IRateLimitRule, Util } from '../../util';
import { Request } from 'express';
import { ERateLimitPageKey } from '../../utility/enums';

@Controller('auth/marketplace')
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Post()
  create(@Body() createMarketplaceDto: CreateMarketplaceDto) {
    return this.marketplaceService.create(createMarketplaceDto);
  }

  @Get()
  async findAll(@Query() query, @Req() req: Request) {
    const rateLimited: IRateLimitRule = await Util.rateLimitPage(
      ERateLimitPageKey.MARKETPLACE,
      (req as any).clientIp,
    );
    if (rateLimited) {
      throw new HttpException('rate limited', 429);
    } else {
      return await this.marketplaceService.findAll(query);
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: Request) {
    const rateLimited: IRateLimitRule = await Util.rateLimitPage(
      ERateLimitPageKey.MARKETPLACE,
      (req as any).clientIp,
    );
    if (rateLimited) {
      throw new HttpException('rate limited', 429);
    } else {
      return await this.marketplaceService.findOne(+id);
    }
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateMarketplaceDto: UpdateMarketplaceDto,
  ) {
    return this.marketplaceService.update(+id, updateMarketplaceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.marketplaceService.remove(+id);
  }
}
