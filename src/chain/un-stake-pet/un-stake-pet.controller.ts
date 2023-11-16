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
import { UnStakePetService } from './un-stake-pet.service';
import { CreateUnStakePetDto } from './dto/create-un-stake-pet.dto';
import { UpdateUnStakePetDto } from './dto/update-un-stake-pet.dto';
import { Request } from 'express';
import { IRateLimitRule, Util } from '../../util';
import { ERateLimitPageKey } from '../../utility/enums';

@Controller('/chain/un-stake-pet')
export class UnStakePetController {
  constructor(private readonly unStakePetService: UnStakePetService) {}

  @Post()
  async create(
    @Body() createUnStakePetDto: CreateUnStakePetDto,
    @Req() req: Request,
  ) {
    await Util.checkLaunchModeStatus((req as any).ethAddress);

    if (!(await Util.isUserConnected((req as any).ethAddress))) {
      throw new BadRequestException(
        'You must connect to the system before taking this action.',
      );
    }

    const rateLimited: IRateLimitRule = await Util.rateLimitPage(
      ERateLimitPageKey.UN_STAKE_PET,
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
      return this.unStakePetService.create(createUnStakePetDto, req);
    }
  }

  @Get()
  findAll() {
    return this.unStakePetService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.unStakePetService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateUnStakePetDto: UpdateUnStakePetDto,
  ) {
    return this.unStakePetService.update(+id, updateUnStakePetDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.unStakePetService.remove(+id);
  }
}
