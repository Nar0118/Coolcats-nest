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
import { DelistItemService } from './delist-item.service';
import { CreateDelistItemDto } from './dto/create-delist-item.dto';
import { UpdateDelistItemDto } from './dto/update-delist-item.dto';
import { Request } from 'express';
import { IRateLimitRule, Util } from '../../util';
import { ERateLimitPageKey } from '../../utility/enums';

@Controller('/chain/delist-item')
export class DelistItemController {
  constructor(private readonly delistItemService: DelistItemService) {}

  @Post()
  async create(
    @Body() createDelistItemDto: CreateDelistItemDto,
    @Req() req: Request,
  ) {
    await Util.checkLaunchModeStatus((req as any).ethAddress);

    if (!(await Util.isUserConnected((req as any).ethAddress))) {
      throw new BadRequestException(
        'You must connect to the system before taking this action.',
      );
    }

    const rateLimited: IRateLimitRule = await Util.rateLimitPage(
      ERateLimitPageKey.DELIST_ITEM,
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
      return await this.delistItemService.create(createDelistItemDto, req);
    }
  }

  @Get()
  findAll() {
    return this.delistItemService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.delistItemService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDelistItemDto: UpdateDelistItemDto,
  ) {
    return this.delistItemService.update(+id, updateDelistItemDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.delistItemService.remove(+id);
  }
}
