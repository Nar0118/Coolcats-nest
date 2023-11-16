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
import { SyncQuestsService } from './sync-quests.service';
import { CreateSyncQuestDto } from './dto/create-sync-quest.dto';
import { UpdateSyncQuestDto } from './dto/update-sync-quest.dto';
import { IRateLimitRule, Util } from '../../util';
import { Request } from 'express';
import { ERateLimitPageKey } from '../../utility/enums';

@Controller('auth/sync-quests')
export class SyncQuestsController {
  constructor(private readonly syncQuestsService: SyncQuestsService) {}

  @Post()
  async create(
    @Body() createSyncQuestDto: CreateSyncQuestDto,
    @Req() req: Request,
  ) {
    if (!(await Util.isUserConnected((req as any).ethAddress))) {
      throw new BadRequestException(
        'You must connect to the system before taking this action.',
      );
    }

    const rateLimited: IRateLimitRule = await Util.rateLimitPage(
      ERateLimitPageKey.SYNC_QUESTS,
      (req as any).clientIp,
    );
    if (rateLimited) {
      throw new HttpException('rate limited', 429);
    } else {
      return await this.syncQuestsService.create(createSyncQuestDto, req);
    }
  }

  @Get()
  findAll() {
    return this.syncQuestsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.syncQuestsService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateSyncQuestDto: UpdateSyncQuestDto,
  ) {
    return this.syncQuestsService.update(+id, updateSyncQuestDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.syncQuestsService.remove(+id);
  }
}
