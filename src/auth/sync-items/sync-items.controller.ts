import {
  BadRequestException,
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
import { SyncItemsService } from './sync-items.service';
import { CreateSyncItemDto } from './dto/create-sync-item.dto';
import { UpdateSyncItemDto } from './dto/update-sync-item.dto';
import { Request } from 'express';
import { IRateLimitRule, Util } from '../../util';
import { ERateLimitPageKey } from '../../utility/enums';

@Controller('auth/sync-items')
export class SyncItemsController {
  constructor(private readonly syncItemsService: SyncItemsService) {}

  @Post()
  async create(
    @Body() createSyncItemDto: CreateSyncItemDto,
    @Req() req: Request,
  ) {
    if (!(await Util.isUserConnected((req as any).ethAddress))) {
      throw new BadRequestException(
        'You must connect to the system before taking this action.',
      );
    }

    // We are going to rate limit this page 1 time per hour
    const syncItemsRateLimit: IRateLimitRule[] = [
      { maxHits: 1, windowSecs: 3600 },
    ];
    const rateLimited: IRateLimitRule = await Util.rateLimitPage(
      ERateLimitPageKey.SYNC_ITEMS,
      (req as any).clientIp,
      syncItemsRateLimit,
    );
    if (rateLimited) {
      throw new HttpException(
        'You have recently synchronized your items, please try this again later',
        429,
      );
    } else {
      return this.syncItemsService.create(CreateSyncItemDto, req);
    }
  }

  @Get()
  findAll() {
    return this.syncItemsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.syncItemsService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateSyncItemDto: UpdateSyncItemDto,
  ) {
    return this.syncItemsService.update(+id, updateSyncItemDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.syncItemsService.remove(+id);
  }
}
