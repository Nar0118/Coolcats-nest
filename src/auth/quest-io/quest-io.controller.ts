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
import { QuestIoService } from './quest-io.service';
import { CreateQuestIoDto } from './dto/create-quest-io.dto';
import { UpdateQuestIoDto } from './dto/update-quest-io.dto';
import { IRateLimitRule, Util } from '../../util';
import { Request } from 'express';
import { ERateLimitPageKey } from '../../utility/enums';

@Controller('auth/quest-io')
export class QuestIoController {
  constructor(private readonly questIoService: QuestIoService) {}

  @Post()
  create(@Body() createQuestIoDto: CreateQuestIoDto) {
    return this.questIoService.create(createQuestIoDto);
  }

  @Get()
  async findAll(@Query() query, @Req() req: Request) {
    const rateLimited: IRateLimitRule = await Util.rateLimitPage(
      ERateLimitPageKey.QUEST_IO,
      (req as any).clientIp,
    );
    if (rateLimited) {
      throw new HttpException('rate limited', 429);
    } else {
      return this.questIoService.findAll(query);
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: Request) {
    const rateLimited: IRateLimitRule = await Util.rateLimitPage(
      ERateLimitPageKey.QUEST_IO,
      (req as any).clientIp,
    );
    if (rateLimited) {
      throw new HttpException('rate limited', 429);
    } else {
      return this.questIoService.findOne(+id);
    }
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateQuestIoDto: UpdateQuestIoDto) {
    return this.questIoService.update(+id, updateQuestIoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.questIoService.remove(+id);
  }
}
