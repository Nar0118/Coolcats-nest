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
import { QuestThemeService } from './quest-theme.service';
import { CreateQuestThemeDto } from './dto/create-quest-theme.dto';
import { UpdateQuestThemeDto } from './dto/update-quest-theme.dto';
import { Request } from 'express';
import { IRateLimitRule, Util } from '../../util';
import { ERateLimitPageKey } from '../../utility/enums';

@Controller('auth/quest-theme')
export class QuestThemeController {
  constructor(private readonly questThemeService: QuestThemeService) {}

  @Post()
  create(@Body() createQuestThemeDto: CreateQuestThemeDto) {
    return this.questThemeService.create(createQuestThemeDto);
  }

  @Get()
  async findAll(@Query() query, @Req() req: Request) {
    const rateLimited: IRateLimitRule = await Util.rateLimitPage(
      ERateLimitPageKey.QUEST_THEME,
      (req as any).clientIp,
    );
    if (rateLimited) {
      throw new HttpException('rate limited', 429);
    } else {
      return await this.questThemeService.findAll(query);
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: Request) {
    const rateLimited: IRateLimitRule = await Util.rateLimitPage(
      ERateLimitPageKey.QUEST_THEME,
      (req as any).clientIp,
    );
    if (rateLimited) {
      throw new HttpException('rate limited', 429);
    } else {
      return await this.questThemeService.findOne(+id);
    }
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateQuestThemeDto: UpdateQuestThemeDto,
  ) {
    return this.questThemeService.update(+id, updateQuestThemeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.questThemeService.remove(+id);
  }
}
