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
import { RollQuestsService } from './roll-quests.service';
import { CreateRollQuestDto } from './dto/create-roll-quest.dto';
import { UpdateRollQuestDto } from './dto/update-roll-quest.dto';
import { Request } from 'express';
import { IRateLimitRule, Util } from '../../util';
import { ERateLimitPageKey } from '../../utility/enums';

@Controller('/chain/roll-quests')
export class RollQuestsController {
  constructor(private readonly rollQuestsService: RollQuestsService) {}

  @Post()
  async create(
    @Body() createRollQuestDto: CreateRollQuestDto,
    @Req() req: Request,
  ) {
    await Util.checkLaunchModeStatus((req as any).ethAddress);

    if (!(await Util.isUserConnected((req as any).ethAddress))) {
      throw new BadRequestException(
        'You must connect to the system before taking this action.',
      );
    }

    const rateLimited: IRateLimitRule = await Util.rateLimitPage(
      ERateLimitPageKey.ROLL_QUESTS,
      (req as any).clientIp,
    );
    if (rateLimited) {
      throw new HttpException('page rate limited', 429);
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
      return await this.rollQuestsService.create(createRollQuestDto, req);
    }
  }

  @Get()
  findAll() {
    return this.rollQuestsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rollQuestsService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateRollQuestDto: UpdateRollQuestDto,
  ) {
    return this.rollQuestsService.update(+id, updateRollQuestDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.rollQuestsService.remove(+id);
  }
}
