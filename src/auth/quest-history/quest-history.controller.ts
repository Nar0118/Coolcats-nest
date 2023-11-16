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
import { QuestHistoryService } from './quest-history.service';
import { CreateQuestHistoryDto } from './dto/create-quest-history.dto';
import { UpdateQuestHistoryDto } from './dto/update-quest-history.dto';
import { Request } from 'express';
import { IRateLimitRule, Util } from '../../util';
import { ERateLimitPageKey } from '../../utility/enums';

@Controller('auth/quest-history')
export class QuestHistoryController {
  constructor(private readonly questHistoryService: QuestHistoryService) {}

  @Post()
  create(@Body() createQuestHistoryDto: CreateQuestHistoryDto) {
    return this.questHistoryService.create(createQuestHistoryDto);
  }

  @Get()
  async findAll(@Query() query, @Req() req: Request) {
    const rateLimited: IRateLimitRule = await Util.rateLimitPage(
      ERateLimitPageKey.QUEST_HISTORY,
      (req as any).clientIp,
    );
    if (rateLimited) {
      throw new HttpException('rate limited', 429);
    } else {
      return await this.questHistoryService.findAll(query);
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.questHistoryService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateQuestHistoryDto: UpdateQuestHistoryDto,
  ) {
    return this.questHistoryService.update(+id, updateQuestHistoryDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.questHistoryService.remove(+id);
  }
}
