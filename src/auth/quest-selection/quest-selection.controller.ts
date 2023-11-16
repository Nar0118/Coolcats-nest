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
import { QuestSelectionService } from './quest-selection.service';
import { CreateQuestSelectionDto } from './dto/create-quest-selection.dto';
import { UpdateQuestSelectionDto } from './dto/update-quest-selection.dto';
import { Request } from 'express';
import { IRateLimitRule, Util } from '../../util';
import { ERateLimitPageKey } from '../../utility/enums';

@Controller('auth/quest-selection')
export class QuestSelectionController {
  constructor(private readonly questSelectionService: QuestSelectionService) {}

  @Post()
  create(@Body() createQuestSelectionDto: CreateQuestSelectionDto) {
    return this.questSelectionService.create(createQuestSelectionDto);
  }

  @Get()
  async findAll(@Query() query, @Req() req: Request) {
    const rateLimited: IRateLimitRule = await Util.rateLimitPage(
      ERateLimitPageKey.QUEST_SELECTION,
      (req as any).clientIp,
    );
    if (rateLimited) {
      throw new HttpException('rate limited', 429);
    } else {
      return await this.questSelectionService.findAll(query);
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.questSelectionService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateQuestSelectionDto: UpdateQuestSelectionDto,
  ) {
    return this.questSelectionService.update(+id, updateQuestSelectionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.questSelectionService.remove(+id);
  }
}
