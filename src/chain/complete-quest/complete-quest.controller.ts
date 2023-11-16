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
import { CompleteQuestService } from './complete-quest.service';
import { CreateCompleteQuestDto } from './dto/create-complete-quest.dto';
import { UpdateCompleteQuestDto } from './dto/update-complete-quest.dto';
import { Request } from 'express';
import { IRateLimitRule, Util } from '../../util';
import { ERateLimitPageKey } from '../../utility/enums';

@Controller('/chain/complete-quest')
export class CompleteQuestController {
  constructor(private readonly completeQuestService: CompleteQuestService) {}

  @Post()
  async create(
    @Body() createCompleteQuestDto: CreateCompleteQuestDto,
    @Req() req: Request,
  ) {
    await Util.checkLaunchModeStatus((req as any).ethAddress);

    if (!(await Util.isUserConnected((req as any).ethAddress))) {
      throw new BadRequestException(
        'You must connect to the system before taking this action.',
      );
    }

    const rateLimited: IRateLimitRule = await Util.rateLimitPage(
      ERateLimitPageKey.COMPLETE_QUEST,
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
      return await this.completeQuestService.create(
        createCompleteQuestDto,
        req,
      );
    }
  }

  @Get()
  findAll() {
    return this.completeQuestService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.completeQuestService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCompleteQuestDto: UpdateCompleteQuestDto,
  ) {
    return this.completeQuestService.update(+id, updateCompleteQuestDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.completeQuestService.remove(+id);
  }
}
